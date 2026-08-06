import type { DashboardSummary, Equipment } from './types'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function getEquipment(labId?: string) {
  const query = labId ? `?labId=${encodeURIComponent(labId)}` : ''
  return getJson<Equipment[]>(`/api/equipment${query}`)
}

export function getDashboardSummary(labId?: string) {
  const query = labId ? `?labId=${encodeURIComponent(labId)}` : ''
  return getJson<DashboardSummary>(`/api/dashboard/summary${query}`)
}
