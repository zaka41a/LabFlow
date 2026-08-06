import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppLink } from '../../components/AppLink'
import { EquipmentTable } from '../../components/EquipmentTable'
import { Icon } from '../../components/Icon'
import { PageHeader } from '../../components/PageHeader'
import { StatusBadge } from '../../components/StatusBadge'
import { getEquipment } from '../../lib/api'
import { typeLabels } from '../../lib/labels'
import type { AppPath } from '../../lib/navigation'
import type { Equipment } from '../../lib/types'

interface EquipmentPageProps {
  onNavigate: (path: AppPath) => void
}

export function EquipmentPage({ onNavigate }: EquipmentPageProps) {
  const [query, setQuery] = useState('')
  const [labId, setLabId] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const equipment = useQuery({
    queryKey: ['equipment', labId],
    queryFn: () => getEquipment(labId || undefined),
  })

  const filtered = (equipment.data ?? []).filter((item) =>
    `${item.name} ${item.serialNumber} ${item.type}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gerätekatalog"
        title="Laborgeräte"
        description="Den Bestand durchsuchen, Verfügbarkeit in Echtzeit prüfen und passende Geräte direkt für einen Antrag auswählen."
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Geräte durchsuchen</span>
          <Icon name="search" className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name oder Seriennummer"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-ink-950 placeholder:text-slate-400"
          />
        </label>
        <label>
          <span className="sr-only">Labor filtern</span>
          <select
            value={labId}
            onChange={(event) => setLabId(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-ink-950 sm:w-44"
          >
            <option value="">Alle Labore</option>
            <option value="LAB_A">LAB_A</option>
            <option value="LAB_B">LAB_B</option>
          </select>
        </label>
      </div>

      {selectedEquipment && (
        <section
          aria-label="Gerätedetails"
          className="relative overflow-hidden rounded-3xl border border-blue-200 bg-white p-6 shadow-xl shadow-blue-100/50 sm:p-7"
        >
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-brand-600 to-emerald-500" />
          <button
            type="button"
            onClick={() => setSelectedEquipment(null)}
            className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-ink-950"
            aria-label="Gerätedetails schließen"
          >
            <Icon name="close" className="size-5" />
          </button>
          <div className="grid gap-6 pr-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedEquipment.status} />
                <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {selectedEquipment.labId}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-ink-950">{selectedEquipment.name}</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Inventarnummer</dt>
                  <dd className="mt-1 font-bold text-ink-950">{selectedEquipment.serialNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Gerätetyp</dt>
                  <dd className="mt-1 font-bold text-ink-950">{typeLabels[selectedEquipment.type]}</dd>
                </div>
              </dl>
            </div>
            {selectedEquipment.status === 'AVAILABLE' ? (
              <AppLink
                to="/requests"
                onNavigate={onNavigate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
              >
                Ausleihe anfragen
                <Icon name="arrow" className="size-4" />
              </AppLink>
            ) : (
              <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-bold text-slate-500">
                Derzeit nicht anfragbar
              </span>
            )}
          </div>
        </section>
      )}

      {equipment.isPending ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Geräte werden geladen…
        </div>
      ) : equipment.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          Der Gerätekatalog konnte nicht geladen werden.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-bold text-ink-950">Keine Geräte gefunden</p>
          <p className="mt-1 text-sm text-slate-500">Passen Sie Suche oder Laborfilter an.</p>
        </div>
      ) : (
        <EquipmentTable equipment={filtered} onSelect={setSelectedEquipment} />
      )}
    </div>
  )
}
