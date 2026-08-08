import { describe, expect, it } from 'vitest'
import { canAccessPath, normalizeAppPath, workspacePathForRole } from './navigation'

describe('role based navigation', () => {
  it('only exposes the matching role workspace', () => {
    expect(canAccessPath('/requests', ['BORROWER'])).toBe(true)
    expect(canAccessPath('/approvals', ['BORROWER'])).toBe(false)
    expect(canAccessPath('/handover', ['LAB_MANAGER'])).toBe(false)
    expect(canAccessPath('/approvals', ['LAB_MANAGER'])).toBe(true)
    expect(canAccessPath('/handover', ['TECHNICIAN'])).toBe(true)
  })

  it('selects the correct landing workspace', () => {
    expect(workspacePathForRole('BORROWER')).toBe('/requests')
    expect(workspacePathForRole('LAB_MANAGER')).toBe('/approvals')
    expect(workspacePathForRole('TECHNICIAN')).toBe('/handover')
  })

  it('normalizes a trailing slash on refreshed application routes', () => {
    expect(normalizeAppPath('/equipment/')).toBe('/equipment')
    expect(normalizeAppPath('/requests///')).toBe('/requests')
    expect(normalizeAppPath('/unknown')).toBeNull()
  })
})
