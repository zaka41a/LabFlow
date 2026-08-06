export type EquipmentStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'CHECKED_OUT'
  | 'MAINTENANCE'

export type EquipmentType =
  | 'LAPTOP'
  | 'SENSOR'
  | 'CAMERA'
  | 'MICROCONTROLLER'
  | 'MEASURING_DEVICE'
  | 'OTHER'

export interface Equipment {
  id: string
  labId: string
  name: string
  type: EquipmentType
  serialNumber: string
  status: EquipmentStatus
}

export interface DashboardSummary {
  total: number
  available: number
  reserved: number
  checkedOut: number
  maintenance: number
}

export type DemoRole = 'BORROWER' | 'LAB_MANAGER' | 'TECHNICIAN'

export type LoanStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CHECKED_OUT'
  | 'RETURNED'

export interface LoanRequestSummary {
  id: string
  reference: string
  equipmentName: string
  serialNumber: string
  borrowerName: string
  labId: string
  purpose: string
  status: LoanStatus
  requestedFrom: string
  requestedUntil: string
  dueDate?: string
  submittedAt?: string
  updatedAt: string
}

export type HandoverKind = 'CHECKOUT' | 'RETURN'

export interface HandoverAppointment {
  id: string
  requestReference: string
  kind: HandoverKind
  equipmentName: string
  serialNumber: string
  borrowerName: string
  labId: string
  scheduledAt: string
  location: string
}
