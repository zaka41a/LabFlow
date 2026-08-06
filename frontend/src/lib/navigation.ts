export const appPaths = [
  '/',
  '/equipment',
  '/requests',
  '/approvals',
  '/handover',
] as const

export type AppPath = (typeof appPaths)[number]

export function isAppPath(path: string): path is AppPath {
  return appPaths.some((candidate) => candidate === path)
}
