export type EquipmentStatus = 'AVAILABLE' | 'RESERVED' | 'CHECKED_OUT' | 'MAINTENANCE'

export type EquipmentType =
  | 'LAPTOP'
  | 'SENSOR'
  | 'CAMERA'
  | 'MICROCONTROLLER'
  | 'MEASURING_DEVICE'
  | 'POWER_TOOL'
  | 'SOLDERING_EQUIPMENT'
  | 'LABORATORY_DEVICE'
  | 'OTHER'

export type EquipmentAccessPolicy = 'OPEN' | 'INSTRUCTION_REQUIRED' | 'QUALIFICATION_REQUIRED'

export interface Equipment {
  id: string
  labId: string
  name: string
  type: EquipmentType
  serialNumber: string
  status: EquipmentStatus
  accessPolicy: EquipmentAccessPolicy
  requiredQualification?: string
  imageUrl: string
}

export interface DashboardSummary {
  total: number
  available: number
  reserved: number
  checkedOut: number
  maintenance: number
}

export type UserRole = 'BORROWER' | 'LAB_MANAGER' | 'TECHNICIAN'

export interface AuthenticatedUser {
  id: string
  username: string
  displayName: string
  labId: string
  labName: string
  roles: UserRole[]
  sessionTimeoutSeconds: number
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthenticationConfig {
  localLoginEnabled: boolean
  oidcEnabled: boolean
  oidcLoginUrl?: string
}

export type LoanStatus =
  'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'CHECKED_OUT' | 'RETURNED'

export interface LoanRequestSummary {
  id: string
  reference: string
  equipmentId: string
  equipmentName: string
  serialNumber: string
  imageUrl: string
  equipmentType: EquipmentType
  accessPolicy: EquipmentAccessPolicy
  requiredQualification?: string
  borrowerName: string
  labId: string
  purpose: string
  status: LoanStatus
  requestedFrom: string
  requestedUntil: string
  dueDate?: string
  rejectionReason?: string
  qualificationEvidence?: string
  accessRequirementVerified: boolean
  accessVerifiedByName?: string
  accessVerifiedAt?: string
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
  imageUrl: string
  borrowerName: string
  labId: string
  scheduledAt: string
  location: string
}

export type EquipmentCondition = 'FAULTLESS' | 'MINOR_WEAR' | 'REVIEW_REQUIRED'

export interface CreateLoanRequest {
  equipmentId: string
  purpose: string
  qualificationEvidence?: string
  requestedFrom: string
  requestedUntil: string
}
