import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Icon } from '../../components/Icon'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { getPendingHandovers, recordHandover } from '../../lib/api'
import { formatDateTime } from '../../lib/formatters'
import type { EquipmentCondition, HandoverAppointment, HandoverKind } from '../../lib/types'

const kindLabels: Record<HandoverKind, string> = {
  CHECKOUT: 'Ausgaben',
  RETURN: 'Rückgaben',
}

const conditionLabels: Record<EquipmentCondition, string> = {
  FAULTLESS: 'Einwandfrei',
  MINOR_WEAR: 'Leichte Gebrauchsspuren',
  REVIEW_REQUIRED: 'Prüfung erforderlich',
}

interface HandoverPageProps {
  labName: string
}

export function HandoverPage({ labName }: HandoverPageProps) {
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<HandoverKind>('CHECKOUT')
  const [announcement, setAnnouncement] = useState<string | null>(null)
  const handovers = useQuery({
    queryKey: ['handovers'],
    queryFn: getPendingHandovers,
  })
  const appointments = handovers.data ?? []

  const mutation = useMutation({
    mutationFn: ({
      appointment,
      condition,
      notes,
    }: {
      appointment: HandoverAppointment
      condition: EquipmentCondition
      notes: string
    }) => recordHandover(appointment.id, appointment.kind, condition, notes),
    onSuccess: async (request) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['handovers'] }),
        queryClient.invalidateQueries({ queryKey: ['equipment'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
      ])
      setAnnouncement(`${request.reference} wurde vollständig dokumentiert.`)
    },
    onError: (error) => setAnnouncement(errorMessage(error)),
  })

  const visibleAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.kind === kind),
    [appointments, kind],
  )
  const checkoutCount = appointments.filter((appointment) => appointment.kind === 'CHECKOUT').length
  const returnCount = appointments.filter((appointment) => appointment.kind === 'RETURN').length

  const confirmHandover = (event: FormEvent<HTMLFormElement>, appointment: HandoverAppointment) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    mutation.mutate({
      appointment,
      condition: String(data.get('condition')) as EquipmentCondition,
      notes: String(data.get('notes')).trim(),
    })
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Übergabe"
        title="Ausgabe und Rückgabe"
        description="Bearbeiten Sie geplante Übergaben und dokumentieren Sie den Zustand der Geräte."
        actions={
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-1 shadow-sm">
            {(Object.keys(kindLabels) as HandoverKind[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setKind(item)}
                className={`rounded px-3.5 py-2 text-sm font-semibold ${kind === item ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {kindLabels[item]}
              </button>
            ))}
          </div>
        }
      />

      {announcement && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          <span className="grid size-7 place-items-center rounded-full bg-emerald-600 text-white">
            <Icon name="check" className="size-4" />
          </span>
          {announcement}
        </div>
      )}

      <section aria-label="Übergabekennzahlen" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Geplante Ausgaben"
          value={checkoutCount}
          detail="Identität und Zubehör prüfen"
          icon="handover"
          tone="brand"
        />
        <StatCard
          label="Erwartete Rückgaben"
          value={returnCount}
          detail="Zustand dokumentieren"
          icon="approvals"
          tone="emerald"
        />
        <StatCard
          label="Offene Vorgänge"
          value={appointments.length}
          detail="über beide Warteschlangen"
          icon="clock"
          tone="sky"
        />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-950">{kindLabels[kind]} bearbeiten</h2>
            <p className="mt-1 text-sm text-slate-500">Chronologisch nach vereinbartem Termin</p>
          </div>
          <span className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            {visibleAppointments.length} offen
          </span>
        </div>

        {handovers.isPending ? (
          <MessagePanel>Übergaben werden geladen…</MessagePanel>
        ) : handovers.isError ? (
          <MessagePanel error>Die Übergaben konnten nicht geladen werden.</MessagePanel>
        ) : (
          <div className="space-y-4">
            {visibleAppointments.map((appointment, index) => (
              <article
                key={appointment.id}
                className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
              >
                <div
                  className={`absolute inset-y-0 left-0 w-1 ${appointment.kind === 'CHECKOUT' ? 'bg-brand-700' : 'bg-emerald-600'}`}
                />
                <div className="grid gap-6 p-5 pl-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(15rem,0.8fr)] lg:p-7 lg:pl-9">
                  <div>
                    <div className="flex flex-col gap-5 sm:flex-row">
                      <img
                        src={appointment.imageUrl}
                        alt={`Produktansicht: ${appointment.equipmentName}`}
                        width="160"
                        height="120"
                        loading="lazy"
                        className="aspect-[4/3] w-full rounded-md border border-slate-200 bg-slate-50 object-cover sm:w-40"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold tracking-wider text-brand-700">
                            {appointment.requestReference}
                          </span>
                          <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            Position {index + 1}
                          </span>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-ink-950">
                          {appointment.equipmentName}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {appointment.serialNumber} · {labName}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="flex items-start gap-3 rounded-md bg-slate-50 p-3.5">
                        <Icon name="clock" className="mt-0.5 size-4 shrink-0 text-brand-600" />
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Termin
                          </dt>
                          <dd className="mt-1 font-semibold text-ink-950">
                            {formatDateTime(appointment.scheduledAt)}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-md bg-slate-50 p-3.5">
                        <Icon name="location" className="mt-0.5 size-4 shrink-0 text-brand-700" />
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Übergabeort
                          </dt>
                          <dd className="mt-1 font-semibold text-ink-950">
                            {appointment.location}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </div>

                  <form
                    onSubmit={(event) => confirmHandover(event, appointment)}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-md bg-brand-700 text-white">
                        <Icon name="user" className="size-5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Ausleihende Person
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-ink-950">
                          {appointment.borrowerName}
                        </p>
                      </div>
                    </div>
                    <div className="my-4 h-px bg-slate-200" />
                    <label className="block">
                      <span className="text-sm font-medium text-ink-950">
                        Dokumentierter Zustand
                      </span>
                      <select
                        name="condition"
                        required
                        defaultValue="FAULTLESS"
                        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink-950 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                      >
                        {(Object.keys(conditionLabels) as EquipmentCondition[]).map((condition) => (
                          <option key={condition} value={condition}>
                            {conditionLabels[condition]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="mt-4 block">
                      <span className="text-sm font-medium text-ink-950">
                        Bemerkung <span className="text-slate-400">(optional)</span>
                      </span>
                      <textarea
                        name="notes"
                        maxLength={1000}
                        rows={2}
                        className="mt-2 w-full resize-none rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink-950 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
                    >
                      <Icon name="check" className="size-4" />
                      {mutation.isPending
                        ? 'Speichern…'
                        : appointment.kind === 'CHECKOUT'
                          ? 'Ausgabe dokumentieren'
                          : 'Rückgabe bestätigen'}
                    </button>
                  </form>
                </div>
              </article>
            ))}

            {visibleAppointments.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-md bg-emerald-50 text-emerald-700">
                  <Icon name="check" className="size-7" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink-950">
                  Alle Vorgänge abgeschlossen
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  In dieser Warteschlange sind keine offenen Übergaben vorhanden.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function MessagePanel({ children, error = false }: { children: string; error?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-8 text-center text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-slate-200 bg-white text-slate-500'}`}
    >
      {children}
    </div>
  )
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Der Vorgang konnte nicht gespeichert werden.'
}
