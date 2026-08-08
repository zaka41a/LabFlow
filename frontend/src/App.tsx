import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppShell } from './components/AppShell'
import { LoginPage, SessionLoadingScreen } from './features/auth/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { EquipmentPage } from './features/dashboard/EquipmentPage'
import { RequestsPage } from './features/requests/RequestsPage'
import { ApprovalsPage } from './features/approvals/ApprovalsPage'
import { HandoverPage } from './features/handover/HandoverPage'
import { ApiError, getAuthenticationConfig, getCurrentUser, login, logout } from './lib/api'
import {
  canAccessPath,
  normalizeAppPath,
  workspacePathForRole,
  type AppPath,
} from './lib/navigation'
import type { LoginCredentials } from './lib/types'

function getCurrentPath(): AppPath {
  return normalizeAppPath(window.location.pathname) ?? '/'
}

export default function App() {
  const queryClient = useQueryClient()
  const [path, setPath] = useState<AppPath>(getCurrentPath)

  const session = useQuery({
    queryKey: ['session'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: 'always',
  })

  const authenticationConfig = useQuery({
    queryKey: ['authentication-config'],
    queryFn: getAuthenticationConfig,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (user) => {
      queryClient.setQueryData(['session'], user)
      const nextPath = workspacePathForRole(user.roles[0] ?? 'BORROWER')
      window.history.replaceState({}, '', nextPath)
      setPath(nextPath)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
  })

  useEffect(() => {
    const normalizedPath = getCurrentPath()
    if (normalizedPath !== window.location.pathname) {
      window.history.replaceState({}, '', normalizedPath)
    }

    const handlePopState = () => setPath(getCurrentPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const user = session.data

  useEffect(() => {
    if (user && !canAccessPath(path, user.roles)) {
      window.history.replaceState({}, '', '/')
      setPath('/')
    }
  }, [path, user])

  const navigate = useCallback((nextPath: AppPath) => {
    if (nextPath !== window.location.pathname) {
      window.history.pushState({}, '', nextPath)
    }
    setPath(nextPath)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (session.isPending) {
    return <SessionLoadingScreen />
  }

  if (!user) {
    return (
      <LoginPage
        pending={loginMutation.isPending}
        error={loginMutation.isPending ? null : loginError(loginMutation.error ?? session.error)}
        onLogin={(credentials) => loginMutation.mutateAsync(credentials).then(() => undefined)}
        oidcLoginUrl={authenticationConfig.data?.oidcLoginUrl}
      />
    )
  }

  return (
    <AppShell
      activePath={path}
      user={user}
      loggingOut={logoutMutation.isPending}
      onLogout={() => logoutMutation.mutate()}
      onNavigate={navigate}
    >
      {path === '/' && <DashboardPage onNavigate={navigate} user={user} />}
      {path === '/equipment' && <EquipmentPage onNavigate={navigate} user={user} />}
      {path === '/requests' && <RequestsPage user={user} />}
      {path === '/approvals' && <ApprovalsPage labName={user.labName} />}
      {path === '/handover' && <HandoverPage labName={user.labName} />}
    </AppShell>
  )
}

function loginError(error: Error | null) {
  if (!error) {
    return null
  }
  if (error instanceof ApiError && error.status === 401) {
    return 'E-Mail-Adresse oder Passwort ist nicht korrekt.'
  }
  return 'Der Anmeldedienst ist momentan nicht erreichbar. Bitte versuchen Sie es erneut.'
}
