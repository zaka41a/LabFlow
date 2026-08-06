import { useQuery } from '@tanstack/react-query'
import { EquipmentTable } from '../../components/EquipmentTable'
import { AppLink } from '../../components/AppLink'
import { Icon } from '../../components/Icon'
import { StatCard } from '../../components/StatCard'
import { getDashboardSummary, getEquipment } from '../../lib/api'
import type { AppPath } from '../../lib/navigation'

interface DashboardPageProps {
  onNavigate: (path: AppPath) => void
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const summary = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => getDashboardSummary(),
  })
  const equipment = useQuery({
    queryKey: ['equipment'],
    queryFn: () => getEquipment(),
  })

  const isError = summary.isError || equipment.isError
  const isPending = summary.isPending || equipment.isPending

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-ink-950 px-6 py-7 text-white shadow-xl shadow-slate-300/40 sm:px-8 sm:py-9">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-300">LabFlow Workspace</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Laborgeräte. Klar verwaltet.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Verfolgen Sie Verfügbarkeit, Anträge und Übergaben in einem nachvollziehbaren Prozess.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <AppLink
              to="/equipment"
              onNavigate={onNavigate}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-950/20 transition hover:bg-brand-400"
            >
              Geräte ansehen
              <Icon name="arrow" className="size-4" />
            </AppLink>
            <AppLink
              to="/requests"
              onNavigate={onNavigate}
              className="rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
            >
              Antrag erstellen
            </AppLink>
          </div>
        </div>
      </section>

      {isError && (
        <section className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <div>
            <p className="font-bold">Backend nicht erreichbar</p>
            <p className="mt-1 text-sm">Starten Sie die Spring Boot API auf Port 8080.</p>
          </div>
          <button
            className="rounded-xl bg-white p-2.5 shadow-sm hover:bg-rose-100"
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

      <section aria-label="Kennzahlen">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Geräte gesamt" value={summary.data?.total ?? 0} detail="in allen Laboren" icon="equipment" tone="brand" />
          <StatCard label="Verfügbar" value={summary.data?.available ?? 0} detail="sofort anfragbar" icon="approvals" tone="emerald" />
          <StatCard label="Reserviert" value={summary.data?.reserved ?? 0} detail="für genehmigte Anträge" icon="requests" tone="amber" />
          <StatCard label="Ausgeliehen" value={summary.data?.checkedOut ?? 0} detail="aktuell in Nutzung" icon="handover" tone="sky" />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Gerätekatalog</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-ink-950">Aktueller Bestand</h2>
          </div>
          <AppLink
            to="/equipment"
            onNavigate={onNavigate}
            className="text-sm font-bold text-brand-700 hover:text-brand-600"
          >
            Alle anzeigen
          </AppLink>
        </div>
        {isPending ? (
          <LoadingRows />
        ) : (
          <EquipmentTable equipment={(equipment.data ?? []).slice(0, 5)} />
        )}
      </section>
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-12 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}
