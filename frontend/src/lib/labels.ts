import type { DemoRole, EquipmentStatus, EquipmentType, LoanStatus } from './types'

export const roleLabels: Record<DemoRole, string> = {
  BORROWER: 'Borrower',
  LAB_MANAGER: 'Lab Manager',
  TECHNICIAN: 'Technician',
}

export const statusLabels: Record<EquipmentStatus, string> = {
  AVAILABLE: 'Verfügbar',
  RESERVED: 'Reserviert',
  CHECKED_OUT: 'Ausgeliehen',
  MAINTENANCE: 'Wartung',
}

export const typeLabels: Record<EquipmentType, string> = {
  LAPTOP: 'Laptop',
  SENSOR: 'Sensor',
  CAMERA: 'Kamera',
  MICROCONTROLLER: 'Mikrocontroller',
  MEASURING_DEVICE: 'Messgerät',
  OTHER: 'Sonstiges',
}

export const loanStatusLabels: Record<LoanStatus, string> = {
  DRAFT: 'Entwurf',
  SUBMITTED: 'Eingereicht',
  APPROVED: 'Genehmigt',
  REJECTED: 'Abgelehnt',
  CANCELLED: 'Storniert',
  CHECKED_OUT: 'Ausgegeben',
  RETURNED: 'Zurückgegeben',
}
