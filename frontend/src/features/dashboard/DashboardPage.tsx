import { useQuery } from '@tanstack/react-query'
import { AppLink } from '../../components/AppLink'
import { EquipmentTable } from '../../components/EquipmentTable'
import { Icon } from '../../components/Icon'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { getDashboardSummary, getEquipment } from '../../lib/api'
import { workspacePathForRole, type AppPath } from '../../lib/navigation'
import type { AuthenticatedUser, UserRole } from '../../lib/types'

interface DashboardPageProps {
  onNavigate: (path: AppPath) => void
  user: AuthenticatedUser
}

const workspaceCopy: Record<UserRole, { action: string; description: string }> = {
  BORROWER: {
    action: 'Neuen Antrag erstellen',
    description: 'Prüfen Sie verfügbare Geräte und verwalten Sie Ihre laufenden Ausleihanträge.',
  },
  LAB_MANAGER: {
    action: 'Offene Freigaben prüfen',
    description: 'Bearbeiten Sie offene Anträge und treffen Sie nachvollziehbare Entscheidungen.',
  },
  TECHNICIAN: {
    action: 'Übergaben bearbeiten',
    description: 'Dokumentieren Sie anstehende Ausgaben und Rückgaben vollständig.',
  },
}

export function DashboardPage({ onNavigate, user }: DashboardPageProps) {
  const primaryRole = user.roles[0] ?? 'BORROWER'
  const workspace = workspaceCopy[primaryRole]
  const summary = useQuery({
    queryKey: ['dashboard-summary', user.labId],
    queryFn: getDashboardSummary,
  })
  const equipment = useQuery({
    queryKey: ['equipment', user.labId],
    queryFn: getEquipment,
  })

  const isError = summary.isError || equipment.isError
  const isPending = summary.isPending || equipment.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übersicht"
        title={`${greeting()}, ${firstName(user.displayName)}`}
        description={workspace.description}
        actions={
          <AppLink
            to={workspacePathForRole(primaryRole)}
            onNavigate={onNavigate}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            {workspace.action}
            <Icon name="arrow" className="size-4" />
          </AppLink>
        }
      />

      <section
        className="grid overflow-hidden rounded-lg border border-slate-200 bg-white md:grid-cols-3"
        aria-label="Arbeitskontext"
      >
        <ContextItem icon="location" label="Labor" value={user.labName} />
        <ContextItem icon="user" label="Angemeldet als" value={user.displayName} />
        <ContextItem icon="shield" label="Zugriff" value="Rollenbasiert freigegeben" />
      </section>

      {isError && (
        <section className="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <div>
            <p className="font-semibold">Daten konnten nicht geladen werden</p>
            <p className="mt-1 text-sm">Die Verbindung zur Anwendung ist derzeit unterbrochen.</p>
          </div>
          <button
            className="rounded-md border border-rose-200 bg-white p-2 hover:bg-rose-100"
            onClick={() => {
              void summary.refetch()
              void equipment.refetch()
            }}
            aria-label="Daten erneut laden"
          >
            <Icon name="refresh" className="size-5" />
          </button>
        </section>
      )}

      <section aria-label="Kennzahlen" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Geräte gesamt"
          value={summary.data?.total ?? 0}
          detail={user.labName}
          icon="equipment"
          tone="brand"
        />
        <StatCard
          label="Verfügbar"
          value={summary.data?.available ?? 0}
          detail="sofort anfragbar"
          icon="check"
          tone="emerald"
        />
        <StatCard
          label="Reserviert"
          value={summary.data?.reserved ?? 0}
          detail="für genehmigte Anträge"
          icon="requests"
          tone="amber"
        />
        <StatCard
          label="Ausgeliehen"
          value={summary.data?.checkedOut ?? 0}
          detail="aktuell in Verwendung"
          icon="handover"
          tone="sky"
        />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-950">Aktueller Gerätebestand</h2>
            <p className="mt-1 text-sm text-slate-500">
              Zuletzt aktualisierte Geräte in Ihrem Labor.
            </p>
          </div>
          <AppLink
            to="/equipment"
            onNavigate={onNavigate}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Alle Geräte
            <Icon name="arrow" className="size-4" />
          </AppLink>
        </div>
        {isPending ? (
          <LoadingState />
        ) : (
          <EquipmentTable equipment={(equipment.data ?? []).slice(0, 5)} />
        )}
      </section>
    </div>
  )
}

function ContextItem({
  icon,
  label,
  value,
}: {
  icon: 'location' | 'user' | 'shield'
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700">
        <Icon name={icon} className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-ink-950">{value}</p>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
      Gerätebestand wird geladen…
    </div>
  )
}

function firstName(displayName: string) {
  return displayName.split(' ')[0]
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Guten Morgen'
  if (hour < 18) return 'Guten Tag'
  return 'Guten Abend'
}
