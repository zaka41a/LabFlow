import type { UserRole } from './types'

export const appPaths = ['/', '/equipment', '/requests', '/approvals', '/handover'] as const

export type AppPath = (typeof appPaths)[number]

const requiredRoleByPath: Partial<Record<AppPath, UserRole>> = {
  '/requests': 'BORROWER',
  '/approvals': 'LAB_MANAGER',
  '/handover': 'TECHNICIAN',
}

export function isAppPath(path: string): path is AppPath {
  return appPaths.some((candidate) => candidate === path)
}

export function normalizeAppPath(path: string): AppPath | null {
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path
  return isAppPath(normalized) ? normalized : null
}

export function canAccessPath(path: AppPath, roles: UserRole[]) {
  const requiredRole = requiredRoleByPath[path]
  return !requiredRole || roles.includes(requiredRole)
}

export function workspacePathForRole(role: UserRole): AppPath {
  if (role === 'LAB_MANAGER') {
    return '/approvals'
  }
  if (role === 'TECHNICIAN') {
    return '/handover'
  }
  return '/requests'
}
