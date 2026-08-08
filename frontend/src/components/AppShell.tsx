import { useEffect, useState, type ReactNode } from 'react'
import { roleLabels } from '../lib/labels'
import type { AppPath } from '../lib/navigation'
import type { AuthenticatedUser, UserRole } from '../lib/types'
import { AppLink } from './AppLink'
import { Icon, type IconName } from './Icon'

interface NavigationItem {
  label: string
  href: AppPath
  icon: IconName
  roles?: UserRole[]
}

interface AppShellProps {
  activePath: AppPath
  user: AuthenticatedUser
  loggingOut: boolean
  onLogout: () => void
  onNavigate: (path: AppPath) => void
  children: ReactNode
}

const navigation: NavigationItem[] = [
  { label: 'Übersicht', href: '/', icon: 'dashboard' },
  { label: 'Gerätebestand', href: '/equipment', icon: 'equipment' },
  { label: 'Meine Anträge', href: '/requests', icon: 'requests', roles: ['BORROWER'] },
  { label: 'Freigaben', href: '/approvals', icon: 'approvals', roles: ['LAB_MANAGER'] },
  { label: 'Ausgabe und Rückgabe', href: '/handover', icon: 'handover', roles: ['TECHNICIAN'] },
]

export function AppShell({
  activePath,
  user,
  loggingOut,
  onLogout,
  onNavigate,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const primaryRole = user.roles[0] ?? 'BORROWER'
  const activeItem = navigation.find((item) => item.href === activePath) ?? navigation[0]
  const visibleNavigation = navigation.filter(
    (item) => !item.roles || item.roles.some((role) => user.roles.includes(role)),
  )

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        setUserMenuOpen(false)
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const navigateAndClose = (path: AppPath) => {
    onNavigate(path)
    setMobileOpen(false)
    setUserMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          aria-label="Navigation schließen"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-700 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4 text-ink-950">
          <div>
            <img
              src="/branding/fh-aachen-logo.webp"
              alt="FH Aachen"
              width="320"
              height="94"
              className="h-auto w-40"
            />
            <p className="mt-2 text-xs font-medium text-slate-500">Geräteverwaltung</p>
          </div>
          <button
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-ink-950 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Navigation schließen"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5" aria-label="Hauptnavigation">
          <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-brand-200">
            Navigation
          </p>
          <div className="space-y-1">
            {visibleNavigation.map((item) => {
              const active = activePath === item.href
              return (
                <AppLink
                  key={item.href}
                  to={item.href}
                  onNavigate={navigateAndClose}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm font-medium ${
                    active
                      ? 'border-white bg-white/15 text-white'
                      : 'border-transparent text-brand-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon name={item.icon} className="size-5 shrink-0" />
                  <span>{item.label}</span>
                </AppLink>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-white/20 px-5 py-4 text-xs leading-5 text-brand-100">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400" />
            <span>System verfügbar</span>
          </div>
          <p className="mt-2">
            Abmeldung nach {Math.round(user.sessionTimeoutSeconds / 60)} Minuten Inaktivität.
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-brand-800 bg-brand-700 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex h-16 max-w-[86rem] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="grid size-10 shrink-0 place-items-center rounded-md border border-white/30 text-white hover:bg-white/10 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Navigation öffnen"
              >
                <Icon name="menu" className="size-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{activeItem.label}</p>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                onClick={() => setUserMenuOpen((current) => !current)}
                className="flex min-w-0 items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-white/10"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white text-xs font-semibold text-brand-800">
                  {initials(user.displayName)}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-40 truncate text-sm font-semibold text-white">
                    {user.displayName}
                  </span>
                  <span className="block text-xs text-brand-100">{roleLabels[primaryRole]}</span>
                </span>
                <Icon
                  name="chevron"
                  className={`hidden size-4 text-brand-100 sm:block ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.5rem)] w-[min(19rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white shadow-md"
                >
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink-950">
                      {user.displayName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{user.username}</p>
                    <p className="mt-2 text-xs font-medium text-brand-700">
                      {roleLabels[primaryRole]}
                    </p>
                  </div>
                  <button
                    role="menuitem"
                    type="button"
                    disabled={loggingOut}
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 rounded-b-lg px-4 py-3 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Icon name="logout" className="size-5" />
                    {loggingOut ? 'Abmeldung läuft…' : 'Abmelden'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[86rem]">{children}</div>
        </main>
      </div>
    </div>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
