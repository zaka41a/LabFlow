import type {
  AuthenticatedUser,
  AuthenticationConfig,
  CreateLoanRequest,
  DashboardSummary,
  Equipment,
  EquipmentCondition,
  HandoverAppointment,
  LoginCredentials,
  LoanRequestSummary,
} from './types'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

interface CsrfToken {
  headerName: string
  token: string
}

interface ProblemDetails {
  title?: string
  status?: number
}

let csrfToken: CsrfToken | null = null
let csrfRequest: Promise<CsrfToken> | null = null

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  if (unsafeMethods.has(method)) {
    const token = await getCsrfToken()
    headers.set(token.headerName, token.token)
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    method,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    throw await createApiError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function createApiError(response: Response) {
  let message = `Die Anfrage ist mit Status ${response.status} fehlgeschlagen.`

  try {
    const problem = (await response.json()) as ProblemDetails
    if (problem.title) {
      message = problem.title
    }
  } catch {
    // The response body is optional for infrastructure errors.
  }

  return new ApiError(response.status, message)
}

async function requestCsrfToken() {
  const response = await fetch(`${baseUrl}/api/auth/csrf`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })

  if (!response.ok) {
    throw await createApiError(response)
  }

  return response.json() as Promise<CsrfToken>
}

export async function getCsrfToken(forceRefresh = false) {
  if (forceRefresh) {
    csrfToken = null
    csrfRequest = null
  }
  if (csrfToken) {
    return csrfToken
  }
  if (!csrfRequest) {
    csrfRequest = requestCsrfToken()
      .then((token) => {
        csrfToken = token
        return token
      })
      .finally(() => {
        csrfRequest = null
      })
  }
  return csrfRequest
}

export async function getCurrentUser() {
  try {
    return await apiRequest<AuthenticatedUser>('/api/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }
    throw error
  }
}

export function getAuthenticationConfig() {
  return apiRequest<AuthenticationConfig>('/api/auth/config')
}

export async function login(credentials: LoginCredentials) {
  const body = new URLSearchParams({
    username: credentials.username.trim(),
    password: credentials.password,
  })

  await apiRequest<void>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  await getCsrfToken(true)
  const user = await getCurrentUser()
  if (!user) {
    throw new ApiError(401, 'Die Sitzung konnte nicht erstellt werden.')
  }
  return user
}

export async function logout() {
  try {
    await apiRequest<void>('/api/auth/logout', { method: 'POST' })
  } finally {
    csrfToken = null
    csrfRequest = null
  }
}

export function getEquipment() {
  return apiRequest<Equipment[]>('/api/equipment')
}

export function getDashboardSummary() {
  return apiRequest<DashboardSummary>('/api/dashboard/summary')
}

export function getMyLoanRequests() {
  return apiRequest<LoanRequestSummary[]>('/api/loan-requests')
}

export function createLoanRequest(command: CreateLoanRequest) {
  return jsonRequest<LoanRequestSummary>('/api/loan-requests', 'POST', command)
}

export function submitLoanRequest(requestId: string) {
  return apiRequest<LoanRequestSummary>(`/api/loan-requests/${requestId}/submit`, {
    method: 'POST',
  })
}

export function cancelLoanRequest(requestId: string) {
  return apiRequest<LoanRequestSummary>(`/api/loan-requests/${requestId}/cancel`, {
    method: 'POST',
  })
}

export function getPendingApprovals() {
  return apiRequest<LoanRequestSummary[]>('/api/approvals/pending')
}

export function approveLoanRequest(
  requestId: string,
  dueDate: string,
  accessRequirementVerified: boolean,
) {
  return jsonRequest<LoanRequestSummary>(`/api/approvals/${requestId}/approve`, 'POST', {
    dueDate,
    accessRequirementVerified,
  })
}

export function rejectLoanRequest(requestId: string, reason: string) {
  return jsonRequest<LoanRequestSummary>(`/api/approvals/${requestId}/reject`, 'POST', {
    reason,
  })
}

export function getPendingHandovers() {
  return apiRequest<HandoverAppointment[]>('/api/handover/pending')
}

export function recordHandover(
  requestId: string,
  kind: 'CHECKOUT' | 'RETURN',
  condition: EquipmentCondition,
  notes?: string,
) {
  const action = kind === 'CHECKOUT' ? 'checkout' : 'return'
  return jsonRequest<LoanRequestSummary>(`/api/handover/${requestId}/${action}`, 'POST', {
    condition,
    notes: notes || null,
  })
}

function jsonRequest<T>(path: string, method: string, body: unknown) {
  return apiRequest<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
