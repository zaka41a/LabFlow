import type {
  EquipmentAccessPolicy,
  EquipmentStatus,
  EquipmentType,
  LoanStatus,
  UserRole,
} from './types'

export const roleLabels: Record<UserRole, string> = {
  BORROWER: 'Borrower',
  LAB_MANAGER: 'Lab Manager',
  TECHNICIAN: 'Technician',
}

export function labLabel(labId: string) {
  return labId === 'FH_AACHEN' ? 'Labor FH Aachen' : labId
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
  POWER_TOOL: 'Elektrowerkzeug',
  SOLDERING_EQUIPMENT: 'Löttechnik',
  LABORATORY_DEVICE: 'Laborgerät',
  OTHER: 'Sonstiges',
}

export const accessPolicyLabels: Record<EquipmentAccessPolicy, string> = {
  OPEN: 'Standardzugang',
  INSTRUCTION_REQUIRED: 'Unterweisung erforderlich',
  QUALIFICATION_REQUIRED: 'Qualifikation erforderlich',
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
