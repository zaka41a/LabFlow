import { useCallback, useEffect, useState } from 'react'
import { AppShell } from './components/AppShell'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { EquipmentPage } from './features/dashboard/EquipmentPage'
import { RequestsPage } from './features/requests/RequestsPage'
import { ApprovalsPage } from './features/approvals/ApprovalsPage'
import { HandoverPage } from './features/handover/HandoverPage'
import { isAppPath, type AppPath } from './lib/navigation'
import type { DemoRole } from './lib/types'

const requiredRoleByPath: Partial<Record<AppPath, DemoRole>> = {
  '/requests': 'BORROWER',
  '/approvals': 'LAB_MANAGER',
  '/handover': 'TECHNICIAN',
}

function getCurrentPath(): AppPath {
  return isAppPath(window.location.pathname) ? window.location.pathname : '/'
}

export default function App() {
  const [path, setPath] = useState<AppPath>(getCurrentPath)
  const [role, setRole] = useState<DemoRole>(() => requiredRoleByPath[getCurrentPath()] ?? 'BORROWER')

  useEffect(() => {
    if (!isAppPath(window.location.pathname)) {
      window.history.replaceState({}, '', '/')
    }

    const handlePopState = () => {
      const currentPath = getCurrentPath()
      setPath(currentPath)
      setRole((currentRole) => requiredRoleByPath[currentPath] ?? currentRole)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((nextPath: AppPath) => {
    if (nextPath !== window.location.pathname) {
      window.history.pushState({}, '', nextPath)
    }
    setPath(nextPath)
    setRole((currentRole) => requiredRoleByPath[nextPath] ?? currentRole)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <AppShell
      activePath={path}
      role={role}
      onRoleChange={setRole}
      onNavigate={navigate}
    >
      {path === '/' && <DashboardPage onNavigate={navigate} />}
      {path === '/equipment' && <EquipmentPage onNavigate={navigate} />}
      {path === '/requests' && <RequestsPage />}
      {path === '/approvals' && <ApprovalsPage />}
      {path === '/handover' && <HandoverPage />}
    </AppShell>
  )
}
