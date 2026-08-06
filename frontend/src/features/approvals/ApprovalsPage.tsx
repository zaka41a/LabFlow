import { useMemo, useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { approvalRequests } from '../../lib/demoData'
import { formatDateRange, formatDateTime } from '../../lib/formatters'
import type { LoanRequestSummary } from '../../lib/types'

type LabFilter = 'ALL' | 'LAB_A' | 'LAB_B'

export function ApprovalsPage() {
  const [requests, setRequests] = useState(() => [...approvalRequests])
  const [labFilter, setLabFilter] = useState<LabFilter>('ALL')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null)

  const visibleRequests = useMemo(
    () => requests.filter((request) => labFilter === 'ALL' || request.labId === labFilter),
    [labFilter, requests],
  )

  const approve = (request: LoanRequestSummary) => {
    removeFromQueue(request.id)
    setDecisionMessage(`${request.reference} wurde genehmigt und für die Ausgabe vorgemerkt.`)
  }

  const reject = (event: FormEvent<HTMLFormElement>, request: LoanRequestSummary) => {
    event.preventDefault()
    const reason = String(new FormData(event.currentTarget).get('reason')).trim()
    if (reason.length < 10) {
      return
    }

    removeFromQueue(request.id)
    setDecisionMessage(`${request.reference} wurde mit dokumentierter Begründung abgelehnt.`)
  }

  const removeFromQueue = (requestId: string) => {
    setRequests((current) => current.filter((request) => request.id !== requestId))
    setRejectingId(null)
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Lab Manager Workspace"
        title="Offene Freigaben"
        description="Anträge nach Laborzuständigkeit prüfen, begründet entscheiden und lückenlos für die Ausgabe vorbereiten."
        actions={
          <label className="relative">
            <span className="sr-only">Labor filtern</span>
            <select
              value={labFilter}
              onChange={(event) => setLabFilter(event.target.value as LabFilter)}
              className="min-w-40 appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-sm font-bold text-ink-950 shadow-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            >
              <option value="ALL">Alle Labore</option>
              <option value="LAB_A">LAB_A</option>
              <option value="LAB_B">LAB_B</option>
            </select>
            <Icon name="chevron" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          </label>
        }
      />

      {decisionMessage && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
        >
          <span className="grid size-7 place-items-center rounded-full bg-emerald-600 text-white">
            <Icon name="check" className="size-4" />
          </span>
          {decisionMessage}
        </div>
      )}

      <section aria-label="Freigabekennzahlen" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Offene Prüfung" value={requests.length} detail="Entscheidung erforderlich" icon="approvals" tone="brand" />
        <StatCard label="LAB_A" value={requests.filter((request) => request.labId === 'LAB_A').length} detail="eigener Zuständigkeitsbereich" icon="equipment" tone="emerald" />
        <StatCard label="Heute eingegangen" value={1} detail="neu seit Arbeitsbeginn" icon="clock" tone="sky" />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-ink-950">Prüfwarteschlange</h2>
            <p className="mt-1 text-sm text-slate-500">
              {visibleRequests.length} {visibleRequests.length === 1 ? 'Antrag' : 'Anträge'} angezeigt
            </p>
          </div>
          <span className="hidden items-center gap-2 text-xs font-bold text-slate-500 sm:flex">
            <span className="size-2 rounded-full bg-emerald-500" />
            Live priorisiert
          </span>
        </div>

        <div className="space-y-4">
          {visibleRequests.map((request) => {
            const isRejecting = rejectingId === request.id

            return (
              <article
                key={request.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(15rem,0.8fr)_auto] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black tracking-[0.1em] text-brand-700">
                        {request.reference}
                      </span>
                      <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {request.labId}
                      </span>
                    </div>
                    <h3 className="mt-3 truncate text-lg font-black text-ink-950">{request.equipmentName}</h3>
                    <p className="mt-1 text-sm text-slate-500">{request.serialNumber}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-950 text-xs font-black text-white">
                        {initials(request.borrowerName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink-950">{request.borrowerName}</p>
                        <p className="text-xs text-slate-500">Borrower</p>
                      </div>
                    </div>
                    <p className="flex items-center gap-2 text-sm text-slate-600">
                      <Icon name="calendar" className="size-4 text-brand-600" />
                      {formatDateRange(request.requestedFrom, request.requestedUntil)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button
                      type="button"
                      onClick={() => setRejectingId(isRejecting ? null : request.id)}
                      className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      Ablehnen
                    </button>
                    <button
                      type="button"
                      onClick={() => approve(request)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                      <Icon name="check" className="size-4" />
                      Genehmigen
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Verwendungszweck</p>
                      <p className="mt-1.5 text-sm leading-6 text-slate-700">{request.purpose}</p>
                    </div>
                    {request.submittedAt && (
                      <p className="text-xs font-medium text-slate-500">Eingegangen {formatDateTime(request.submittedAt)}</p>
                    )}
                  </div>
                </div>

                {isRejecting && (
                  <form
                    onSubmit={(event) => reject(event, request)}
                    className="border-t border-rose-100 bg-rose-50/70 p-5 sm:p-6"
                  >
                    <label className="block">
                      <span className="text-sm font-bold text-rose-900">Begründung der Ablehnung</span>
                      <textarea
                        name="reason"
                        required
                        minLength={10}
                        autoFocus
                        rows={2}
                        placeholder="Nachvollziehbare Begründung für den Borrower"
                        className="mt-2 w-full resize-none rounded-xl border border-rose-200 bg-white px-3.5 py-3 text-sm text-ink-950 shadow-sm placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                      />
                    </label>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRejectingId(null)}
                        className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-white"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-800"
                      >
                        Ablehnung bestätigen
                      </button>
                    </div>
                  </form>
                )}
              </article>
            )
          })}

          {visibleRequests.length === 0 && (
            <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/50 p-12 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                <Icon name="check" className="size-7" />
              </span>
              <h3 className="mt-4 text-lg font-black text-ink-950">Warteschlange ist leer</h3>
              <p className="mt-1 text-sm text-slate-600">Für dieses Labor liegen aktuell keine offenen Anträge vor.</p>
            </div>
          )}
        </div>
      </section>
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
