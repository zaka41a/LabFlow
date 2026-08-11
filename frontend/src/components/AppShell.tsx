import { useEffect, useRef, useState, type ReactNode } from 'react'
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
  const userMenuRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    const closeOutsideUserMenu = (event: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOutsideUserMenu)
    return () => document.removeEventListener('pointerdown', closeOutsideUserMenu)
  }, [])

  const navigateAndClose = (path: AppPath) => {
    onNavigate(path)
    setMobileOpen(false)
    setUserMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-ink-950/55 backdrop-blur-[1px] lg:hidden"
          aria-label="Navigation schließen"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[17.5rem] flex-col border-r border-slate-200 bg-white text-ink-950 shadow-xl shadow-slate-950/10 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative flex items-start justify-between border-b border-slate-200 px-6 pb-6 pt-7">
          <span className="absolute inset-x-0 top-0 h-1 bg-[#42b8a5]" aria-hidden="true" />
          <div className="min-w-0">
            <img
              src="/branding/fh-aachen-logo.webp"
              alt="FH Aachen"
              width="320"
              height="94"
              className="h-auto w-44"
            />
            <div className="mt-5 border-l-2 border-[#42b8a5] pl-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                LabFlow
              </p>
              <p className="mt-0.5 text-base font-semibold tracking-tight text-ink-950">
                Geräteverwaltung
              </p>
            </div>
          </div>
          <button
            className="-mr-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-ink-950 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Navigation schließen"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <div className="px-4 pt-5">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-brand-700">
              <Icon name="location" className="size-[1.1rem]" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Arbeitsbereich
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-ink-950">{user.labName}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Hauptnavigation">
          <p className="px-2 pb-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Navigation
          </p>
          <div className="space-y-1.5">
            {visibleNavigation.map((item) => {
              const active = activePath === item.href
              return (
                <AppLink
                  key={item.href}
                  to={item.href}
                  onNavigate={navigateAndClose}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex min-h-12 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                    active
                      ? 'bg-brand-50 text-brand-800'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-ink-950'
                  }`}
                >
                  {active && (
                    <span
                      className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-brand-600"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-md ${
                      active ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    <Icon name={item.icon} className="size-[1.15rem]" />
                  </span>
                  <span>{item.label}</span>
                </AppLink>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-2.5" aria-hidden="true">
                  <span className="absolute inline-flex size-full rounded-full bg-emerald-200" />
                  <span className="relative inline-flex size-2.5 rounded-full border-2 border-white bg-emerald-600" />
                </span>
                <span className="text-xs font-semibold text-slate-700">System verfügbar</span>
              </div>
              <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-700">
                Online
              </span>
            </div>
            <div className="mt-3 flex items-start gap-2 border-t border-slate-200 pt-3 text-[0.72rem] leading-5 text-slate-500">
              <Icon name="clock" className="mt-0.5 size-4 shrink-0" />
              <p>
                Automatische Abmeldung nach {Math.round(user.sessionTimeoutSeconds / 60)} Minuten
                Inaktivität
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="mx-auto flex h-[4.5rem] max-w-[86rem] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-ink-950 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Navigation öffnen"
              >
                <Icon name="menu" className="size-5" />
              </button>
              <div className="min-w-0 lg:hidden">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  LabFlow
                </p>
                <p className="truncate text-sm font-semibold text-ink-950">{activeItem.label}</p>
              </div>
              <div className="hidden min-w-0 items-center gap-3 lg:flex">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon name="location" className="size-[1.1rem]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Aktiver Arbeitsbereich
                  </p>
                  <p className="truncate text-sm font-semibold text-ink-950">{user.labName}</p>
                </div>
              </div>
            </div>

            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label={`Benutzermenü für ${user.displayName}`}
                onClick={() => setUserMenuOpen((current) => !current)}
                className="flex min-w-0 items-center gap-3 rounded-lg border border-transparent px-1.5 py-1 text-left hover:border-slate-200 hover:bg-slate-50 sm:pr-2.5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-700 text-xs font-bold tracking-wide text-white shadow-sm">
                  {initials(user.displayName)}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-44 truncate text-sm font-semibold text-ink-950">
                    {user.displayName}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {roleLabels[primaryRole]}
                  </span>
                </span>
                <Icon
                  name="chevron"
                  className={`hidden size-4 text-slate-400 sm:block ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.65rem)] w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10"
                >
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-brand-100 bg-white text-xs font-bold tracking-wide text-brand-800">
                        {initials(user.displayName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-950">
                          {user.displayName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{user.username}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                      <span className="text-xs text-slate-500">Berechtigung</span>
                      <span className="rounded-md border border-brand-100 bg-white px-2 py-1 text-xs font-semibold text-brand-700">
                        {roleLabels[primaryRole]}
                      </span>
                    </div>
                  </div>
                  <button
                    role="menuitem"
                    type="button"
                    disabled={loggingOut}
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-rose-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    <span className="grid size-8 place-items-center rounded-md bg-slate-100 text-slate-500">
                      <Icon name="logout" className="size-[1.1rem]" />
                    </span>
                    {loggingOut ? 'Abmeldung läuft…' : 'Abmelden'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
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
