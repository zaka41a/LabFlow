import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AccessPolicyBadge } from '../../components/AccessPolicyBadge'
import { Icon } from '../../components/Icon'
import { LoanStatusBadge } from '../../components/LoanStatusBadge'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import {
  cancelLoanRequest,
  createLoanRequest,
  getEquipment,
  getMyLoanRequests,
  submitLoanRequest,
} from '../../lib/api'
import { formatDateRange, formatDateTime } from '../../lib/formatters'
import { labLabel } from '../../lib/labels'
import type { AuthenticatedUser, LoanRequestSummary, LoanStatus } from '../../lib/types'

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

interface RequestsPageProps {
  user: AuthenticatedUser
}

export function RequestsPage({ user }: RequestsPageProps) {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<RequestFilter>('ACTIVE')
  const [formOpen, setFormOpen] = useState(false)
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState<string | null>(null)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')

  const requestsQuery = useQuery({
    queryKey: ['loan-requests', user.id],
    queryFn: getMyLoanRequests,
  })
  const equipmentQuery = useQuery({
    queryKey: ['equipment', user.labId],
    queryFn: getEquipment,
  })
  const requests = requestsQuery.data ?? []
  const availableEquipment = (equipmentQuery.data ?? []).filter(
    (equipment) => equipment.status === 'AVAILABLE',
  )
  const selectedEquipment = availableEquipment.find(
    (equipment) => equipment.id === selectedEquipmentId,
  )

  const createMutation = useMutation({
    mutationFn: createLoanRequest,
    onSuccess: async (request) => {
      await queryClient.invalidateQueries({ queryKey: ['loan-requests', user.id] })
      setFilter('ACTIVE')
      setFormError(null)
      setFormOpen(false)
      setAnnouncement(`${request.reference} wurde als Entwurf gespeichert.`)
    },
    onError: (error) => setFormError(errorMessage(error)),
  })
  const submitMutation = useMutation({
    mutationFn: submitLoanRequest,
    onSuccess: async (request) => {
      await queryClient.invalidateQueries({ queryKey: ['loan-requests', user.id] })
      setAnnouncement(`${request.reference} wurde zur Prüfung eingereicht.`)
    },
    onError: (error) => setAnnouncement(errorMessage(error)),
  })
  const cancelMutation = useMutation({
    mutationFn: cancelLoanRequest,
    onSuccess: async (request) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['loan-requests', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['equipment', user.labId] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary', user.labId] }),
      ])
      setAnnouncement(`${request.reference} wurde storniert.`)
    },
    onError: (error) => setAnnouncement(errorMessage(error)),
  })

  const activeCount = requests.filter((request) => activeStatuses.has(request.status)).length
  const approvedCount = requests.filter((request) => request.status === 'APPROVED').length
  const checkedOutCount = requests.filter((request) => request.status === 'CHECKED_OUT').length

  const filteredRequests = useMemo(() => {
    if (filter === 'ACTIVE') return requests.filter((request) => activeStatuses.has(request.status))
    if (filter === 'COMPLETED')
      return requests.filter((request) => completedStatuses.has(request.status))
    return requests
  }, [filter, requests])

  const handleCreateRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const equipmentId = String(data.get('equipmentId'))
    const requestedFrom = String(data.get('requestedFrom'))
    const requestedUntil = String(data.get('requestedUntil'))
    const purpose = String(data.get('purpose')).trim()
    const qualificationEvidence = String(data.get('qualificationEvidence') ?? '').trim()

    if (!availableEquipment.some((equipment) => equipment.id === equipmentId)) {
      setFormError('Bitte wählen Sie ein verfügbares Gerät aus.')
      return
    }
    if (requestedUntil < requestedFrom) {
      setFormError('Die geplante Rückgabe darf nicht vor dem Ausleihbeginn liegen.')
      return
    }
    if (selectedEquipment?.accessPolicy !== 'OPEN' && qualificationEvidence.length < 10) {
      setFormError('Bitte geben Sie Ihre Unterweisung oder Qualifikation nachvollziehbar an.')
      return
    }

    try {
      await createMutation.mutateAsync({
        equipmentId,
        purpose,
        qualificationEvidence: qualificationEvidence || undefined,
        requestedFrom,
        requestedUntil,
      })
      form.reset()
      setSelectedEquipmentId('')
    } catch {
      // The mutation renders the normalized API error in the form.
    }
  }

  const actionPending = submitMutation.isPending || cancelMutation.isPending

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Ausleihe"
        title="Meine Anträge"
        description="Erstellen Sie Ausleihanträge und verfolgen Sie deren aktuellen Bearbeitungsstand."
        actions={
          <button
            type="button"
            aria-expanded={formOpen}
            aria-controls="new-loan-request"
            onClick={() => {
              setFormOpen((current) => !current)
              setFormError(null)
            }}
            className="inline-flex items-center gap-2 rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            <Icon name={formOpen ? 'close' : 'plus'} className="size-5" />
            {formOpen ? 'Schließen' : 'Neuer Antrag'}
          </button>
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

      {formOpen && (
        <section
          id="new-loan-request"
          aria-labelledby="new-loan-request-title"
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              Neuer Antrag
            </p>
            <h2 id="new-loan-request-title" className="mt-1 text-lg font-semibold text-ink-950">
              Ausleihantrag anlegen
            </h2>
          </div>
          <form
            onSubmit={(event) => void handleCreateRequest(event)}
            className="grid gap-5 p-6 sm:grid-cols-2 sm:p-7"
          >
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-ink-950">Gerät</span>
              <select
                name="equipmentId"
                required
                value={selectedEquipmentId}
                onChange={(event) => {
                  setSelectedEquipmentId(event.target.value)
                  setFormError(null)
                }}
                disabled={equipmentQuery.isPending}
                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink-950 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              >
                <option value="" disabled>
                  {equipmentQuery.isPending
                    ? 'Geräte werden geladen…'
                    : 'Verfügbares Gerät auswählen'}
                </option>
                {availableEquipment.map((equipment) => (
                  <option key={equipment.id} value={equipment.id}>
                    {equipment.name} · {equipment.serialNumber}
                  </option>
                ))}
              </select>
            </label>
            {selectedEquipment && selectedEquipment.accessPolicy !== 'OPEN' && (
              <div className="rounded-md border border-brand-200 bg-brand-50 p-4 sm:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  <AccessPolicyBadge policy={selectedEquipment.accessPolicy} />
                  <span className="text-sm font-semibold text-ink-950">
                    Prüfung durch die Laborleitung
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Voraussetzung: {selectedEquipment.requiredQualification}
                </p>
                <label className="mt-4 block space-y-2">
                  <span className="text-sm font-medium text-ink-950">
                    Nachweis der Unterweisung oder Qualifikation
                  </span>
                  <textarea
                    name="qualificationEvidence"
                    required
                    minLength={10}
                    maxLength={500}
                    rows={2}
                    placeholder="Zum Beispiel Datum, Kurs oder verantwortliche unterweisende Person"
                    className="w-full resize-none rounded-md border border-brand-200 bg-white px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  />
                </label>
              </div>
            )}
            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-950">Ausleihbeginn</span>
              <input
                type="date"
                name="requestedFrom"
                required
                className="w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm text-ink-950 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-950">Geplante Rückgabe</span>
              <input
                type="date"
                name="requestedUntil"
                required
                className="w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm text-ink-950 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-ink-950">Verwendungszweck</span>
              <textarea
                name="purpose"
                required
                minLength={10}
                maxLength={500}
                rows={3}
                placeholder="Beschreiben Sie kurz, wofür das Gerät benötigt wird."
                className="w-full resize-none rounded-md border border-slate-300 px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
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
                className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-md bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
              >
                {createMutation.isPending ? 'Speichern…' : 'Entwurf speichern'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section aria-label="Antragskennzahlen" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Aktive Anträge"
          value={activeCount}
          detail="in Bearbeitung"
          icon="requests"
          tone="brand"
        />
        <StatCard
          label="Genehmigt"
          value={approvedCount}
          detail="bereit zur Ausgabe"
          icon="approvals"
          tone="emerald"
        />
        <StatCard
          label="Ausgeliehen"
          value={checkedOutCount}
          detail="Rückgabedatum beachten"
          icon="handover"
          tone="sky"
        />
      </section>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-ink-950">Antragsverlauf</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredRequests.length} Einträge angezeigt
            </p>
          </div>
          <div className="inline-flex w-fit rounded-md border border-slate-200 bg-white p-1 shadow-sm">
            {(Object.keys(filterLabels) as RequestFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded px-3.5 py-2 text-sm font-semibold ${filter === item ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-brand-700'}`}
              >
                {filterLabels[item]}
              </button>
            ))}
          </div>
        </div>

        {requestsQuery.isPending ? (
          <MessagePanel>Ausleihanträge werden geladen…</MessagePanel>
        ) : requestsQuery.isError ? (
          <MessagePanel error>Die Ausleihanträge konnten nicht geladen werden.</MessagePanel>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const progress = progressByStatus[request.status]
              const isExpanded = expandedRequestId === request.id
              const canCancel = ['DRAFT', 'SUBMITTED', 'APPROVED'].includes(request.status)

              return (
                <article
                  key={request.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                  <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(13rem,0.8fr)_auto] lg:items-center lg:p-6">
                    <div className="flex min-w-0 items-center gap-4">
                      <img
                        src={request.imageUrl}
                        alt=""
                        width="80"
                        height="60"
                        loading="lazy"
                        className="h-[3.75rem] w-20 shrink-0 rounded-md border border-slate-200 bg-slate-50 object-cover"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold tracking-wider text-brand-700">
                            {request.reference}
                          </span>
                          <LoanStatusBadge status={request.status} />
                        </div>
                        <h3 className="mt-2 truncate text-base font-semibold text-ink-950">
                          {request.equipmentName}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {request.serialNumber} · {labLabel(request.labId)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm text-slate-600">
                      <span className="flex items-center gap-2">
                        <Icon name="calendar" className="size-4 text-brand-600" />
                        {formatDateRange(request.requestedFrom, request.requestedUntil)}
                      </span>
                      {progress && (
                        <div
                          className="flex items-center gap-3"
                          aria-label={`Prozessschritt ${progress} von 5`}
                        >
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-brand-700"
                              style={{ width: `${progress * 20}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-500">{progress}/5</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedRequestId(isExpanded ? null : request.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-700"
                    >
                      Details
                      <Icon name="chevron" className={`size-4 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5 lg:px-6">
                      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Verwendungszweck
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{request.purpose}</p>
                          {request.rejectionReason && (
                            <p className="mt-2 text-sm text-rose-700">
                              Begründung: {request.rejectionReason}
                            </p>
                          )}
                          {request.accessPolicy !== 'OPEN' && (
                            <div className="mt-4 rounded-md border border-brand-100 bg-white p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <AccessPolicyBadge policy={request.accessPolicy} />
                                {request.accessRequirementVerified && (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                    <Icon name="check" className="size-4" />
                                    Durch {request.accessVerifiedByName} geprüft
                                  </span>
                                )}
                              </div>
                              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                                <div>
                                  <dt className="font-medium text-slate-500">Voraussetzung</dt>
                                  <dd className="mt-1 text-slate-700">
                                    {request.requiredQualification}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="font-medium text-slate-500">Ihr Nachweis</dt>
                                  <dd className="mt-1 text-slate-700">
                                    {request.qualificationEvidence}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                          )}
                          <p className="mt-3 text-xs text-slate-500">
                            Zuletzt aktualisiert: {formatDateTime(request.updatedAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          {request.status === 'DRAFT' && (
                            <button
                              type="button"
                              disabled={actionPending}
                              onClick={() => submitMutation.mutate(request.id)}
                              className="rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
                            >
                              Zur Prüfung einreichen
                            </button>
                          )}
                          {canCancel && (
                            <button
                              type="button"
                              disabled={actionPending}
                              onClick={() => cancelMutation.mutate(request.id)}
                              className="rounded-md border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                            >
                              Antrag stornieren
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}

            {filteredRequests.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-md bg-brand-50 text-brand-700">
                  <Icon name="requests" className="size-6" />
                </span>
                <p className="mt-4 font-semibold text-ink-950">Keine Anträge in dieser Ansicht</p>
                <p className="mt-1 text-sm text-slate-500">
                  Wählen Sie einen anderen Filter oder legen Sie einen neuen Antrag an.
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
  return error instanceof Error ? error.message : 'Der Vorgang konnte nicht abgeschlossen werden.'
}
