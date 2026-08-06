import { useMemo, useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { handoverAppointments } from '../../lib/demoData'
import { formatDateTime } from '../../lib/formatters'
import type { HandoverAppointment, HandoverKind } from '../../lib/types'

const kindLabels: Record<HandoverKind, string> = {
  CHECKOUT: 'Ausgaben',
  RETURN: 'Rückgaben',
}

export function HandoverPage() {
  const [appointments, setAppointments] = useState(() => [...handoverAppointments])
  const [kind, setKind] = useState<HandoverKind>('CHECKOUT')
  const [announcement, setAnnouncement] = useState<string | null>(null)

  const visibleAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.kind === kind),
    [appointments, kind],
  )
  const checkoutCount = appointments.filter((appointment) => appointment.kind === 'CHECKOUT').length
  const returnCount = appointments.filter((appointment) => appointment.kind === 'RETURN').length

  const confirmHandover = (
    event: FormEvent<HTMLFormElement>,
    appointment: HandoverAppointment,
  ) => {
    event.preventDefault()
    const condition = String(new FormData(event.currentTarget).get('condition'))
    const action = appointment.kind === 'CHECKOUT' ? 'Ausgabe' : 'Rückgabe'

    setAppointments((current) => current.filter((item) => item.id !== appointment.id))
    setAnnouncement(
      `${action} für ${appointment.requestReference} wurde mit Zustand „${condition}“ dokumentiert.`,
    )
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Technician Workspace"
        title="Ausgabe und Rückgabe"
        description="Geplante Übergaben strukturiert bearbeiten, Gerätezustände erfassen und jeden Vorgang nachvollziehbar abschließen."
        actions={
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {(Object.keys(kindLabels) as HandoverKind[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setKind(item)}
                className={`rounded-lg px-3.5 py-2 text-sm font-bold transition ${
                  kind === item
                    ? item === 'CHECKOUT'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
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
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
        >
          <span className="grid size-7 place-items-center rounded-full bg-emerald-600 text-white">
            <Icon name="check" className="size-4" />
          </span>
          {announcement}
        </div>
      )}

      <section aria-label="Übergabekennzahlen" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Geplante Ausgaben" value={checkoutCount} detail="Identität und Zubehör prüfen" icon="handover" tone="brand" />
        <StatCard label="Erwartete Rückgaben" value={returnCount} detail="Zustand dokumentieren" icon="approvals" tone="emerald" />
        <StatCard label="Offene Vorgänge" value={appointments.length} detail="über beide Warteschlangen" icon="clock" tone="sky" />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-ink-950">{kindLabels[kind]} bearbeiten</h2>
            <p className="mt-1 text-sm text-slate-500">Chronologisch nach vereinbartem Termin</p>
          </div>
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-brand-700">
            {visibleAppointments.length} offen
          </span>
        </div>

        <div className="space-y-4">
          {visibleAppointments.map((appointment, index) => (
            <article
              key={appointment.id}
              className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50"
            >
              <div
                className={`absolute inset-y-0 left-0 w-1.5 ${
                  appointment.kind === 'CHECKOUT' ? 'bg-brand-600' : 'bg-emerald-500'
                }`}
              />
              <div className="grid gap-6 p-5 pl-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(15rem,0.8fr)] lg:p-7 lg:pl-9">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black tracking-[0.12em] text-brand-700">{appointment.requestReference}</span>
                    <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
                      Position {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-black text-ink-950 sm:text-xl">{appointment.equipmentName}</h3>
                  <p className="mt-1 text-sm text-slate-500">{appointment.serialNumber} · {appointment.labId}</p>

                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-xl bg-blue-50/70 p-3.5">
                      <Icon name="clock" className="mt-0.5 size-4 shrink-0 text-brand-600" />
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Termin</dt>
                        <dd className="mt-1 font-bold text-ink-950">{formatDateTime(appointment.scheduledAt)}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl bg-emerald-50/70 p-3.5">
                      <Icon name="location" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Übergabeort</dt>
                        <dd className="mt-1 font-bold text-ink-950">{appointment.location}</dd>
                      </div>
                    </div>
                  </dl>
                </div>

                <form
                  onSubmit={(event) => confirmHandover(event, appointment)}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-ink-950 text-white">
                      <Icon name="user" className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Borrower</p>
                      <p className="mt-0.5 text-sm font-black text-ink-950">{appointment.borrowerName}</p>
                    </div>
                  </div>

                  <div className="my-4 h-px bg-slate-200" />

                  <label className="block">
                    <span className="text-sm font-bold text-ink-950">Dokumentierter Zustand</span>
                    <select
                      name="condition"
                      required
                      defaultValue="Einwandfrei"
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink-950 shadow-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    >
                      <option>Einwandfrei</option>
                      <option>Leichte Gebrauchsspuren</option>
                      <option>Prüfung erforderlich</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition ${
                      appointment.kind === 'CHECKOUT'
                        ? 'bg-brand-600 shadow-brand-600/20 hover:bg-brand-700'
                        : 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700'
                    }`}
                  >
                    <Icon name="check" className="size-4" />
                    {appointment.kind === 'CHECKOUT' ? 'Ausgabe dokumentieren' : 'Rückgabe bestätigen'}
                  </button>
                </form>
              </div>
            </article>
          ))}

          {visibleAppointments.length === 0 && (
            <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/50 p-12 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                <Icon name="check" className="size-7" />
              </span>
              <h3 className="mt-4 text-lg font-black text-ink-950">Alle Vorgänge abgeschlossen</h3>
              <p className="mt-1 text-sm text-slate-600">In dieser Warteschlange sind keine offenen Übergaben vorhanden.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
