import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppLink } from '../../components/AppLink'
import { AccessPolicyBadge } from '../../components/AccessPolicyBadge'
import { EquipmentTable } from '../../components/EquipmentTable'
import { Icon } from '../../components/Icon'
import { PageHeader } from '../../components/PageHeader'
import { StatusBadge } from '../../components/StatusBadge'
import { ApiError, createEquipment, getEquipment } from '../../lib/api'
import { typeLabels } from '../../lib/labels'
import type { AppPath } from '../../lib/navigation'
import type { AuthenticatedUser, CreateEquipment, Equipment } from '../../lib/types'
import { CreateEquipmentForm } from './CreateEquipmentForm'

interface EquipmentPageProps {
  onNavigate: (path: AppPath) => void
  user: AuthenticatedUser
}

export function EquipmentPage({ onNavigate, user }: EquipmentPageProps) {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const isBorrower = user.roles.includes('BORROWER')
  const isTechnician = user.roles.includes('TECHNICIAN')
  const equipment = useQuery({
    queryKey: ['equipment', user.labId],
    queryFn: getEquipment,
  })
  const creation = useMutation({
    mutationFn: (command: CreateEquipment) => createEquipment(command),
    onSuccess: (created) => {
      queryClient.setQueryData<Equipment[]>(['equipment', user.labId], (current = []) =>
        [...current, created].sort((left, right) => left.name.localeCompare(right.name, 'de')),
      )
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary', user.labId] })
      setShowCreateForm(false)
      setSelectedEquipment(created)
      setNotice(`${created.name} wurde dem Gerätebestand hinzugefügt.`)
    },
  })

  const filtered = (equipment.data ?? []).filter((item) =>
    `${item.name} ${item.serialNumber} ${item.type}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gerätekatalog"
        title="Laborgeräte"
        description="Durchsuchen Sie den Gerätebestand und prüfen Sie die aktuelle Verfügbarkeit."
        actions={
          isTechnician ? (
            <button
              type="button"
              onClick={() => {
                creation.reset()
                setNotice(null)
                setSelectedEquipment(null)
                setShowCreateForm(true)
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              <Icon name="plus" className="size-4" />
              Gerät hinzufügen
            </button>
          ) : undefined
        }
      />

      {notice && (
        <div
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          role="status"
        >
          {notice}
        </div>
      )}

      {showCreateForm && isTechnician && (
        <CreateEquipmentForm
          labName={user.labName}
          pending={creation.isPending}
          error={equipmentCreationError(creation.error)}
          onCancel={() => {
            creation.reset()
            setShowCreateForm(false)
          }}
          onSubmit={(command) => creation.mutate(command)}
        />
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Geräte durchsuchen</span>
          <Icon
            name="search"
            className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name oder Seriennummer"
            className="w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-ink-950 placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700">
          <Icon name="location" className="size-4" />
          {user.labName}
        </span>
      </div>

      {selectedEquipment && (
        <section
          aria-label="Gerätedetails"
          className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
        >
          <div className="absolute inset-y-0 left-0 w-1 bg-brand-700" />
          <button
            type="button"
            onClick={() => setSelectedEquipment(null)}
            className="absolute right-4 top-4 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-ink-950"
            aria-label="Gerätedetails schließen"
          >
            <Icon name="close" className="size-5" />
          </button>
          <div className="grid gap-6 pr-10 md:grid-cols-[12rem_minmax(0,1fr)] lg:grid-cols-[12rem_minmax(0,1fr)_auto] lg:items-center">
            <img
              src={selectedEquipment.imageUrl}
              alt={`Produktansicht: ${selectedEquipment.name}`}
              width="640"
              height="480"
              className="aspect-[4/3] w-full rounded-md border border-slate-200 bg-slate-50 object-cover"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedEquipment.status} />
                <AccessPolicyBadge policy={selectedEquipment.accessPolicy} />
                <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {user.labName}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink-950">
                {selectedEquipment.name}
              </h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Inventarnummer
                  </dt>
                  <dd className="mt-1 font-semibold text-ink-950">
                    {selectedEquipment.serialNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Gerätetyp
                  </dt>
                  <dd className="mt-1 font-semibold text-ink-950">
                    {typeLabels[selectedEquipment.type]}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Zugangsvoraussetzung
                  </dt>
                  <dd className="mt-1 font-semibold text-ink-950">
                    {selectedEquipment.requiredQualification ??
                      'Keine zusätzliche Unterweisung erforderlich'}
                  </dd>
                </div>
              </dl>
            </div>
            {selectedEquipment.status === 'AVAILABLE' && isBorrower ? (
              <AppLink
                to="/requests"
                onNavigate={onNavigate}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Ausleihe anfragen
                <Icon name="arrow" className="size-4" />
              </AppLink>
            ) : selectedEquipment.status !== 'AVAILABLE' ? (
              <span className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-sm font-medium text-slate-500">
                Derzeit nicht anfragbar
              </span>
            ) : null}
          </div>
        </section>
      )}

      {equipment.isPending ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Geräte werden geladen…
        </div>
      ) : equipment.isError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          Der Gerätekatalog konnte nicht geladen werden.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-semibold text-ink-950">Keine Geräte gefunden</p>
          <p className="mt-1 text-sm text-slate-500">
            Ändern Sie den Suchbegriff und versuchen Sie es erneut.
          </p>
        </div>
      ) : (
        <EquipmentTable equipment={filtered} onSelect={setSelectedEquipment} />
      )}
    </div>
  )
}

function equipmentCreationError(error: Error | null) {
  if (!error) return null
  if (error instanceof ApiError && error.status === 409) {
    return 'Diese Inventarnummer ist im Labor bereits vergeben.'
  }
  if (error instanceof ApiError && error.status === 400) {
    return 'Prüfen Sie Bild, Inventardaten und Zugangsvoraussetzung.'
  }
  return 'Das Gerät konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.'
}
