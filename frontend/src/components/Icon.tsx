import type { SVGProps } from 'react'

export type IconName =
  | 'dashboard'
  | 'equipment'
  | 'requests'
  | 'approvals'
  | 'handover'
  | 'menu'
  | 'close'
  | 'search'
  | 'arrow'
  | 'refresh'
  | 'plus'
  | 'calendar'
  | 'clock'
  | 'user'
  | 'location'
  | 'check'
  | 'chevron'

const paths: Record<IconName, string> = {
  dashboard: 'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z',
  equipment: 'M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm1 4v4h10V7H7Zm0 7v3h4v-3H7Zm7 0v3h3v-3h-3Z',
  requests: 'M7 3h10a2 2 0 0 1 2 2v16l-7-3-7 3V5a2 2 0 0 1 2-2Zm2 5v2h6V8H9Zm0 4v2h6v-2H9Z',
  approvals: 'm9.55 16.6-4.2-4.2 1.4-1.4 2.8 2.8 7.7-7.7 1.4 1.4-9.1 9.1Z',
  handover: 'M4 7h11l-2.5-2.5L14 3l5 5-5 5-1.5-1.5L15 9H4V7Zm16 10H9l2.5 2.5L10 21l-5-5 5-5 1.5 1.5L9 15h11v2Z',
  menu: 'M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z',
  close: 'm6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z',
  search: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm5.8 9.9L21 20.6 19.6 22l-4.7-4.7 1.4-1.4Z',
  arrow: 'm9 5 7 7-7 7-1.4-1.4 5.6-5.6-5.6-5.6L9 5Z',
  refresh: 'M12 4a8 8 0 0 1 7.4 5H22l-4 4-4-4h3.2A6 6 0 1 0 18 15h2.1A8 8 0 1 1 12 4Z',
  plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z',
  calendar: 'M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2Zm12 8H5v9h14v-9ZM5 8h14V6h-2v1h-2V6H9v1H7V6H5v2Z',
  clock: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 3v4.6l3.2 1.9-1 1.7-4.2-2.5V7h2Z',
  user: 'M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 10c4.4 0 8 2.2 8 5v2H4v-2c0-2.8 3.6-5 8-5Zm0 2c-3.6 0-6 1.7-6 3h12c0-1.3-2.4-3-6-3Z',
  location: 'M12 2a7 7 0 0 1 7 7c0 5.2-7 13-7 13S5 14.2 5 9a7 7 0 0 1 7-7Zm0 2a5 5 0 0 0-5 5c0 3.2 3.2 7.9 5 10.3 1.8-2.4 5-7.1 5-10.3a5 5 0 0 0-5-5Zm0 2.5A2.5 2.5 0 1 1 12 11a2.5 2.5 0 0 1 0-5Z',
  check: 'm9.4 17.2-5-5L6 10.6l3.4 3.4L18 5.4 19.6 7 9.4 17.2Z',
  chevron: 'm7.4 8.6 4.6 4.6 4.6-4.6L18 10l-6 6-6-6 1.4-1.4Z',
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
}

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d={paths[name]} />
    </svg>
  )
}
