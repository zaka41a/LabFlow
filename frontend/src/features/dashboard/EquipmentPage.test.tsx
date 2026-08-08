import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEquipment, getEquipment } from '../../lib/api'
import type { AuthenticatedUser, Equipment, UserRole } from '../../lib/types'
import { EquipmentPage } from './EquipmentPage'

vi.mock('../../lib/api', () => ({
  ApiError: class ApiError extends Error {
    constructor(
      readonly status: number,
      message: string,
    ) {
      super(message)
    }
  },
  createEquipment: vi.fn(),
  getEquipment: vi.fn(),
}))

const equipment: Equipment = {
  id: '10000000-0000-0000-0000-000000000099',
  labId: 'FH_AACHEN',
  name: 'Präzisionswaage 0,1 mg',
  type: 'LABORATORY_DEVICE',
  serialNumber: 'BIO-2026-099',
  status: 'AVAILABLE',
  accessPolicy: 'QUALIFICATION_REQUIRED',
  requiredQualification: 'Einweisung in die Präzisionswaage',
  imageUrl: '/api/equipment/10000000-0000-0000-0000-000000000099/image',
}

describe('EquipmentPage role controls', () => {
  beforeEach(() => {
    vi.mocked(getEquipment).mockResolvedValue([equipment])
    vi.mocked(createEquipment).mockReset()
  })

  it('offers loan requests only to borrowers', async () => {
    renderPage('BORROWER')

    expect(screen.queryByRole('button', { name: 'Gerät hinzufügen' })).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: `${equipment.name} öffnen` }))

    expect(await screen.findByRole('link', { name: 'Ausleihe anfragen' })).toBeInTheDocument()
  })

  it.each<UserRole>(['LAB_MANAGER', 'TECHNICIAN'])(
    'does not offer loan requests to %s users',
    async (role) => {
      renderPage(role)

      fireEvent.click(await screen.findByRole('button', { name: `${equipment.name} öffnen` }))

      expect(screen.queryByRole('link', { name: 'Ausleihe anfragen' })).not.toBeInTheDocument()
    },
  )

  it('offers equipment intake only to technicians', async () => {
    renderPage('TECHNICIAN')

    const addButton = await screen.findByRole('button', { name: 'Gerät hinzufügen' })
    fireEvent.click(addButton)

    expect(screen.getByRole('heading', { name: 'Gerät hinzufügen' })).toBeInTheDocument()
    expect(screen.getByLabelText('Labor')).toHaveValue('Labor FH Aachen')
  })
})

function renderPage(role: UserRole) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const user: AuthenticatedUser = {
    id: '10000000-0000-0000-0000-000000000001',
    username: `${role.toLowerCase()}@labflow.local`,
    displayName: 'Test User',
    labId: 'FH_AACHEN',
    labName: 'Labor FH Aachen',
    roles: [role],
    sessionTimeoutSeconds: 1800,
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <EquipmentPage user={user} onNavigate={vi.fn()} />
    </QueryClientProvider>,
  )
}
