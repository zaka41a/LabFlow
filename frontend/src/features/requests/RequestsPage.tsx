import { useMemo, useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { LoanStatusBadge } from '../../components/LoanStatusBadge'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { equipmentOptions, myLoanRequests } from '../../lib/demoData'
import { formatDateRange, formatDateTime } from '../../lib/formatters'
import type { LoanRequestSummary, LoanStatus } from '../../lib/types'

type RequestFilter = 'ACTIVE' | 'ALL' | 'COMPLETED'

const activeStatuses = new Set<LoanStatus>(['DRAFT', 'SUBMITTED', 'APPROVED', 'CHECKED_OUT'])
const completedStatuses = new Set<LoanStatus>(['RETURNED', 'REJECTED', 'CANCELLED'])

const filterLabels: Record<RequestFilter, string> = {
  ACTIVE: 'Aktiv',
  ALL: 'Alle',
  COMPLETED: 'Abgeschlossen',
}

const progressByStatus: Partial<Record<LoanStatus, number>> = {
  DRAFT: 1,
  SUBMITTED: 2,
  APPROVED: 3,
  CHECKED_OUT: 4,
  RETURNED: 5,
}

export function RequestsPage() {
  const [requests, setRequests] = useState(() => [...myLoanRequests])
  const [filter, setFilter] = useState<RequestFilter>('ACTIVE')
  const [formOpen, setFormOpen] = useState(false)
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState<string | null>(null)

  const activeCount = requests.filter((request) => activeStatuses.has(request.status)).length
  const approvedCount = requests.filter((request) => request.status === 'APPROVED').length
  const checkedOutCount = requests.filter((request) => request.status === 'CHECKED_OUT').length

  const filteredRequests = useMemo(() => {
    if (filter === 'ACTIVE') {
      return requests.filter((request) => activeStatuses.has(request.status))
    }
    if (filter === 'COMPLETED') {
      return requests.filter((request) => completedStatuses.has(request.status))
    }
    return requests
  }, [filter, requests])

  const handleCreateRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const equipmentId = String(data.get('equipmentId'))
    const requestedFrom = String(data.get('requestedFrom'))
    const requestedUntil = String(data.get('requestedUntil'))
    const purpose = String(data.get('purpose')).trim()
    const equipment = equipmentOptions.find((item) => item.id === equipmentId)

    if (!equipment) {
      setFormError('Bitte wählen Sie ein verfügbares Gerät aus.')
      return
    }
    if (requestedUntil < requestedFrom) {
      setFormError('Das Enddatum darf nicht vor dem Startdatum liegen.')
      return
    }

    const now = new Date()
    const request: LoanRequestSummary = {
      id: crypto.randomUUID(),
      reference: `LF-${now.getFullYear()}-${String(requests.length + 153).padStart(4, '0')}`,
      equipmentName: equipment.name,
      serialNumber: equipment.serialNumber,
      borrowerName: 'Zakaria Sabiri',
      labId: equipment.labId,
      purpose,
      status: 'DRAFT',
      requestedFrom,
      requestedUntil,
      updatedAt: now.toISOString(),
    }

    setRequests((current) => [request, ...current])
    setFilter('ACTIVE')
    setFormError(null)
    setFormOpen(false)
    setAnnouncement(`${request.reference} wurde als Entwurf angelegt.`)
    form.reset()
  }

  const handleCancel = (request: LoanRequestSummary) => {
    setRequests((current) =>
      current.map((item) =>
        item.id === request.id
          ? { ...item, status: 'CANCELLED', updatedAt: new Date().toISOString() }
          : item,
      ),
    )
    setAnnouncement(`${request.reference} wurde storniert.`)
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Borrower Workspace"
        title="Meine Anträge"
        description="Geräte anfragen, Freigaben verfolgen und Rückgabetermine zuverlässig im Blick behalten."
        actions={
          <button
            type="button"
            aria-expanded={formOpen}
            aria-controls="new-loan-request"
            onClick={() => {
              setFormOpen((current) => !current)
              setFormError(null)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
          >
            <Icon name={formOpen ? 'close' : 'plus'} className="size-5" />
            {formOpen ? 'Schließen' : 'Neuer Antrag'}
          </button>
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

      {formOpen && (
        <section
          id="new-loan-request"
          aria-labelledby="new-loan-request-title"
          className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-xl shadow-blue-100/60"
        >
          <div className="border-b border-blue-100 bg-blue-50/70 px-6 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Neuer Entwurf</p>
            <h2 id="new-loan-request-title" className="mt-1 text-xl font-black text-ink-950">
              Laborgerät anfragen
            </h2>
          </div>
          <form onSubmit={handleCreateRequest} className="grid gap-5 p-6 sm:grid-cols-2 sm:p-7">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-bold text-ink-950">Gerät</span>
              <select
                name="equipmentId"
                required
                defaultValue=""
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-ink-950 shadow-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              >
                <option value="" disabled>
                  Verfügbares Gerät auswählen
                </option>
                {equipmentOptions.map((equipment) => (
                  <option key={equipment.id} value={equipment.id}>
                    {equipment.name} · {equipment.serialNumber} · {equipment.labId}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-ink-950">Von</span>
              <input
                type="date"
                name="requestedFrom"
                required
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-ink-950 shadow-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-ink-950">Bis</span>
              <input
                type="date"
                name="requestedUntil"
                required
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-ink-950 shadow-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-bold text-ink-950">Verwendungszweck</span>
              <textarea
                name="purpose"
                required
                minLength={10}
                rows={3}
                placeholder="Kurz beschreiben, wofür das Gerät benötigt wird"
                className="w-full resize-none rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-ink-950 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </label>
            {formError && (
              <p role="alert" className="text-sm font-semibold text-rose-700 sm:col-span-2">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-3 sm:col-span-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
              >
                Entwurf anlegen
              </button>
            </div>
          </form>
        </section>
      )}

      <section aria-label="Antragskennzahlen" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Aktive Anträge" value={activeCount} detail="in Bearbeitung" icon="requests" tone="brand" />
        <StatCard label="Genehmigt" value={approvedCount} detail="bereit zur Ausgabe" icon="approvals" tone="emerald" />
        <StatCard label="Ausgeliehen" value={checkedOutCount} detail="Rückgabedatum beachten" icon="handover" tone="sky" />
      </section>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-black text-ink-950">Antragsverlauf</h2>
            <p className="mt-1 text-sm text-slate-500">{filteredRequests.length} Einträge angezeigt</p>
          </div>
          <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {(Object.keys(filterLabels) as RequestFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-lg px-3.5 py-2 text-sm font-bold transition ${
                  filter === item
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-brand-700'
                }`}
              >
                {filterLabels[item]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const progress = progressByStatus[request.status]
            const isExpanded = expandedRequestId === request.id
            const canCancel = ['DRAFT', 'SUBMITTED', 'APPROVED'].includes(request.status)

            return (
              <article
                key={request.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(13rem,0.8fr)_auto] lg:items-center lg:p-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black tracking-[0.12em] text-brand-700">{request.reference}</span>
                      <LoanStatusBadge status={request.status} />
                    </div>
                    <h3 className="mt-2 truncate text-base font-black text-ink-950 sm:text-lg">{request.equipmentName}</h3>
                    <p className="mt-1 text-sm text-slate-500">{request.serialNumber} · {request.labId}</p>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-600">
                    <span className="flex items-center gap-2">
                      <Icon name="calendar" className="size-4 text-brand-600" />
                      {formatDateRange(request.requestedFrom, request.requestedUntil)}
                    </span>
                    {progress && (
                      <div className="flex items-center gap-3" aria-label={`Prozessschritt ${progress} von 5`}>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-600 to-emerald-500"
                            style={{ width: `${progress * 20}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-500">{progress}/5</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedRequestId(isExpanded ? null : request.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-brand-700"
                  >
                    Details
                    <Icon name="chevron" className={`size-4 transition ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5 lg:px-6">
                    <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Verwendungszweck</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{request.purpose}</p>
                        <p className="mt-3 text-xs text-slate-500">Zuletzt aktualisiert: {formatDateTime(request.updatedAt)}</p>
                      </div>
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => handleCancel(request)}
                          className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                        >
                          Antrag stornieren
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            )
          })}

          {filteredRequests.length === 0 && (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-10 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-brand-700 shadow-sm">
                <Icon name="requests" className="size-6" />
              </span>
              <p className="mt-4 font-black text-ink-950">Keine Anträge in dieser Ansicht</p>
              <p className="mt-1 text-sm text-slate-500">Wählen Sie einen anderen Filter oder legen Sie einen neuen Antrag an.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
