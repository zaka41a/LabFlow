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
  | 'mail'
  | 'lock'
  | 'eye'
  | 'eyeOff'
  | 'shield'
  | 'logout'
  | 'bell'

const paths: Record<IconName, string[]> = {
  dashboard: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  equipment: ['M4 5h16v11H4z', 'M8 20h8', 'M12 16v4'],
  requests: ['M6 3h9l3 3v15H6z', 'M14 3v4h4', 'M9 12h6', 'M9 16h6'],
  approvals: ['M9 5h6', 'M9 3h6v4H9z', 'M7 5H5v16h14V5h-2', 'm9 14 2 2 4-5'],
  handover: ['M4 8h13', 'm14 5 3 3-3 3', 'M20 16H7', 'm10 13-3 3 3 3'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  close: ['m6 6 12 12', 'M18 6 6 18'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'm21 21-4.35-4.35'],
  arrow: ['M5 12h14', 'm14 7 5 5-5 5'],
  refresh: [
    'M20 7v5h-5',
    'M4 17v-5h5',
    'M6.1 9a7 7 0 0 1 11.7-2.6L20 9',
    'M4 15l2.2 2.6A7 7 0 0 0 17.9 15',
  ],
  plus: ['M12 5v14', 'M5 12h14'],
  calendar: ['M6 3v3', 'M18 3v3', 'M4 8h16', 'M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2'],
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21a8 8 0 0 1 16 0'],
  location: [
    'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z',
    'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  ],
  check: ['m5 12 4 4L19 6'],
  chevron: ['m7 10 5 5 5-5'],
  mail: ['M3 5h18v14H3z', 'm3 7 9 6 9-6'],
  lock: ['M5 10h14v11H5z', 'M8 10V7a4 4 0 0 1 8 0v3', 'M12 14v3'],
  eye: ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  eyeOff: [
    'm3 3 18 18',
    'M10.6 5.2A9.7 9.7 0 0 1 12 5c6 0 10 7 10 7a15 15 0 0 1-2.1 3',
    'M6.2 6.2C3.6 8.2 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 3.8-.8',
  ],
  shield: ['M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z', 'm8.5 12 2.2 2.2 4.8-5'],
  logout: ['M10 4H5v16h5', 'M14 8l4 4-4 4', 'M18 12H9'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9', 'M10 21h4'],
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
}

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  )
}
