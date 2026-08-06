import { useState, type ReactNode } from 'react'
import { AppLink } from './AppLink'
import { Icon, type IconName } from './Icon'
import { roleLabels } from '../lib/labels'
import type { DemoRole } from '../lib/types'
import type { AppPath } from '../lib/navigation'

interface NavigationItem {
  label: string
  href: AppPath
  icon: IconName
  roles?: DemoRole[]
}

interface AppShellProps {
  activePath: AppPath
  role: DemoRole
  onRoleChange: (role: DemoRole) => void
  onNavigate: (path: AppPath) => void
  children: ReactNode
}

const navigation: NavigationItem[] = [
  { label: 'Übersicht', href: '/', icon: 'dashboard' },
  { label: 'Geräte', href: '/equipment', icon: 'equipment' },
  { label: 'Meine Anträge', href: '/requests', icon: 'requests', roles: ['BORROWER'] },
  { label: 'Freigaben', href: '/approvals', icon: 'approvals', roles: ['LAB_MANAGER'] },
  { label: 'Übergaben', href: '/handover', icon: 'handover', roles: ['TECHNICIAN'] },
]

export function AppShell({
  activePath,
  role,
  onRoleChange,
  onNavigate,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const visibleNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes(role),
  )

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip lg:grid lg:grid-cols-[17rem_1fr]">
      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-ink-950/35 backdrop-blur-sm lg:hidden"
          aria-label="Navigation schließen"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-68 flex-col bg-ink-950 px-5 py-6 text-white shadow-2xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <AppLink
            to="/"
            onNavigate={onNavigate}
            onNavigated={() => setMobileOpen(false)}
            className="flex items-center gap-3"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-500 font-black tracking-tight text-white shadow-lg shadow-brand-500/25">
              LF
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">LabFlow</span>
              <span className="block text-xs text-slate-400">FH Aachen</span>
            </span>
          </AppLink>
          <button
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Navigation schließen"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <nav className="mt-10 space-y-1" aria-label="Hauptnavigation">
          {visibleNavigation.map((item) => (
            <AppLink
              key={item.href}
              to={item.href}
              onNavigate={onNavigate}
              onNavigated={() => setMobileOpen(false)}
              aria-current={activePath === item.href ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                activePath === item.href
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-950/25'
                  : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon name={item.icon} className="size-5" />
              {item.label}
            </AppLink>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">
            Systemstatus
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-200">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgb(52_211_153_/_0.12)]" />
            Entwicklungsumgebung
          </div>
        </div>
      </aside>

      <div className="min-w-0 overflow-x-clip">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-ink-950 shadow-sm lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Navigation öffnen"
              >
                <Icon name="menu" className="size-5" />
              </button>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Labor</p>
                <p className="text-sm font-semibold text-ink-950">LAB_A · Campus Jülich</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="hidden text-xs font-semibold text-slate-500 sm:block" htmlFor="demo-role">
                Demo Rolle
              </label>
              <select
                id="demo-role"
                value={role}
                onChange={(event) => {
                  const nextRole = event.target.value as DemoRole
                  onRoleChange(nextRole)
                  const activeItem = navigation.find((item) => item.href === activePath)
                  if (activeItem?.roles && !activeItem.roles.includes(nextRole)) {
                    onNavigate('/')
                  }
                }}
                className="min-w-0 max-w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink-950 shadow-sm sm:max-w-none"
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="hidden size-10 place-items-center rounded-xl bg-brand-100 text-sm font-bold text-brand-800 sm:grid">
                ZS
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
