import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AccessPolicyBadge } from '../../components/AccessPolicyBadge'
import { Icon } from '../../components/Icon'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { approveLoanRequest, getPendingApprovals, rejectLoanRequest } from '../../lib/api'
import { formatDateRange, formatDateTime } from '../../lib/formatters'
import type { LoanRequestSummary } from '../../lib/types'

interface ApprovalsPageProps {
  labName: string
}

export function ApprovalsPage({ labName }: ApprovalsPageProps) {
  const queryClient = useQueryClient()
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null)

  const approvals = useQuery({
    queryKey: ['approvals'],
    queryFn: getPendingApprovals,
  })
  const requests = approvals.data ?? []

  const refreshWorkflow = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['approvals'] }),
      queryClient.invalidateQueries({ queryKey: ['equipment'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
    ])
  }

  const approveMutation = useMutation({
    mutationFn: ({
      requestId,
      dueDate,
      accessRequirementVerified,
    }: {
      requestId: string
      dueDate: string
      accessRequirementVerified: boolean
    }) => approveLoanRequest(requestId, dueDate, accessRequirementVerified),
    onSuccess: async (request) => {
      await refreshWorkflow()
      setApprovingId(null)
      setDecisionMessage(`${request.reference} wurde genehmigt und für die Ausgabe vorgemerkt.`)
    },
    onError: (error) => setDecisionMessage(errorMessage(error)),
  })
  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      rejectLoanRequest(requestId, reason),
    onSuccess: async (request) => {
      await refreshWorkflow()
      setRejectingId(null)
      setDecisionMessage(`${request.reference} wurde mit Begründung abgelehnt.`)
    },
    onError: (error) => setDecisionMessage(errorMessage(error)),
  })

  const approve = (event: FormEvent<HTMLFormElement>, request: LoanRequestSummary) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const dueDate = String(data.get('dueDate'))
    const accessRequirementVerified = data.get('accessRequirementVerified') === 'on'
    approveMutation.mutate({ requestId: request.id, dueDate, accessRequirementVerified })
  }

  const reject = (event: FormEvent<HTMLFormElement>, request: LoanRequestSummary) => {
    event.preventDefault()
    const reason = String(new FormData(event.currentTarget).get('reason')).trim()
    if (reason.length >= 10) rejectMutation.mutate({ requestId: request.id, reason })
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Freigabe"
        title="Offene Anträge"
        description="Prüfen Sie eingereichte Anträge und dokumentieren Sie Ihre Entscheidung."
        actions={
          <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700">
            <Icon name="location" className="size-4" />
            {labName}
          </span>
        }
      />

      {decisionMessage && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          <span className="grid size-7 place-items-center rounded-full bg-emerald-600 text-white">
            <Icon name="check" className="size-4" />
          </span>
          {decisionMessage}
        </div>
      )}

      <section aria-label="Freigabekennzahlen" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Offene Prüfung"
          value={requests.length}
          detail="Entscheidung erforderlich"
          icon="approvals"
          tone="brand"
        />
        <StatCard
          label="Im eigenen Labor"
          value={requests.length}
          detail={labName}
          icon="equipment"
          tone="emerald"
        />
        <StatCard
          label="Heute eingegangen"
          value={todayCount(requests)}
          detail="seit Tagesbeginn"
          icon="clock"
          tone="sky"
        />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-950">Prüfwarteschlange</h2>
            <p className="mt-1 text-sm text-slate-500">
              {requests.length} {requests.length === 1 ? 'Antrag' : 'Anträge'} angezeigt
            </p>
          </div>
          <span className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex">
            <Icon name="clock" className="size-4" />
            Nach Eingangszeit sortiert
          </span>
        </div>

        {approvals.isPending ? (
          <MessagePanel>Anträge werden geladen…</MessagePanel>
        ) : approvals.isError ? (
          <MessagePanel error>Die Freigaben konnten nicht geladen werden.</MessagePanel>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const isApproving = approvingId === request.id
              const isRejecting = rejectingId === request.id
              const pending = approveMutation.isPending || rejectMutation.isPending

              return (
                <article
                  key={request.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                  <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(15rem,0.8fr)_auto] xl:items-center">
                    <div className="flex min-w-0 items-center gap-4">
                      <img
                        src={request.imageUrl}
                        alt=""
                        width="96"
                        height="72"
                        loading="lazy"
                        className="h-[4.5rem] w-24 shrink-0 rounded-md border border-slate-200 bg-slate-50 object-cover"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-brand-50 px-2.5 py-1 text-xs font-semibold tracking-wider text-brand-700">
                            {request.reference}
                          </span>
                          <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {labName}
                          </span>
                        </div>
                        <h3 className="mt-3 truncate text-base font-semibold text-ink-950">
                          {request.equipmentName}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">{request.serialNumber}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-700 text-xs font-semibold text-white">
                          {initials(request.borrowerName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-950">
                            {request.borrowerName}
                          </p>
                          <p className="text-xs text-slate-500">Ausleihende Person</p>
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
                        disabled={pending}
                        onClick={() => {
                          setRejectingId(isRejecting ? null : request.id)
                          setApprovingId(null)
                        }}
                        className="rounded-md border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                      >
                        Ablehnen
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setApprovingId(isApproving ? null : request.id)
                          setRejectingId(null)
                        }}
                        className="inline-flex items-center gap-2 rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
                      >
                        <Icon name="check" className="size-4" />
                        Genehmigen
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                    <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Verwendungszweck
                        </p>
                        <p className="mt-1.5 text-sm leading-6 text-slate-700">{request.purpose}</p>
                      </div>
                      {request.submittedAt && (
                        <p className="text-xs font-medium text-slate-500">
                          Eingegangen {formatDateTime(request.submittedAt)}
                        </p>
                      )}
                    </div>
                    {request.accessPolicy !== 'OPEN' && (
                      <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <AccessPolicyBadge policy={request.accessPolicy} />
                          </div>
                          <p className="mt-2 text-sm font-medium text-slate-700">
                            {request.requiredQualification}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Angegebener Nachweis
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {request.qualificationEvidence}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {isApproving && (
                    <form
                      onSubmit={(event) => approve(event, request)}
                      className="border-t border-brand-100 bg-brand-50 p-5 sm:p-6"
                    >
                      <div className="grid gap-4 lg:grid-cols-[auto_minmax(18rem,1fr)_auto] lg:items-end">
                        <label className="block">
                          <span className="text-sm font-semibold text-ink-950">
                            Verbindliches Rückgabedatum
                          </span>
                          <input
                            type="date"
                            name="dueDate"
                            required
                            min={request.requestedFrom}
                            max={request.requestedUntil}
                            defaultValue={request.requestedUntil}
                            className="mt-2 block rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink-950 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                          />
                        </label>
                        {request.accessPolicy !== 'OPEN' ? (
                          <label className="flex items-start gap-3 rounded-md border border-brand-200 bg-white p-3.5">
                            <input
                              type="checkbox"
                              name="accessRequirementVerified"
                              required
                              className="mt-0.5 size-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                            />
                            <span>
                              <span className="block text-sm font-semibold text-ink-950">
                                Zugangsvoraussetzung persönlich geprüft
                              </span>
                              <span className="mt-1 block text-xs leading-5 text-slate-600">
                                Ich bestätige, dass der angegebene Nachweis für dieses Gerät
                                ausreicht.
                              </span>
                            </span>
                          </label>
                        ) : (
                          <p className="rounded-md border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-800">
                            Für dieses Gerät ist keine zusätzliche Qualifikationsprüfung
                            erforderlich.
                          </p>
                        )}
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setApprovingId(null)}
                            className="rounded-md px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-white"
                          >
                            Abbrechen
                          </button>
                          <button
                            type="submit"
                            disabled={approveMutation.isPending}
                            className="rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
                          >
                            Freigabe bestätigen
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {isRejecting && (
                    <form
                      onSubmit={(event) => reject(event, request)}
                      className="border-t border-rose-100 bg-rose-50/70 p-5 sm:p-6"
                    >
                      <label className="block">
                        <span className="text-sm font-semibold text-rose-900">
                          Begründung der Ablehnung
                        </span>
                        <textarea
                          name="reason"
                          required
                          minLength={10}
                          maxLength={500}
                          autoFocus
                          rows={2}
                          placeholder="Nachvollziehbare Begründung für die antragstellende Person"
                          className="mt-2 w-full resize-none rounded-md border border-rose-200 bg-white px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                        />
                      </label>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRejectingId(null)}
                          className="rounded-md px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-white"
                        >
                          Abbrechen
                        </button>
                        <button
                          type="submit"
                          disabled={rejectMutation.isPending}
                          className="rounded-md bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
                        >
                          Ablehnung bestätigen
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              )
            })}

            {requests.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-md bg-emerald-50 text-emerald-700">
                  <Icon name="check" className="size-7" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink-950">Warteschlange ist leer</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Für dieses Labor liegen aktuell keine offenen Anträge vor.
                </p>
              </div>
            )}
          </div>
        )}
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

function todayCount(requests: LoanRequestSummary[]) {
  const today = new Intl.DateTimeFormat('sv-SE').format(new Date())
  return requests.filter((request) => request.submittedAt?.slice(0, 10) === today).length
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
  return error instanceof Error
    ? error.message
    : 'Die Entscheidung konnte nicht gespeichert werden.'
}
