import { statusLabels } from '../lib/labels'
import type { EquipmentStatus } from '../lib/types'

const styles: Record<EquipmentStatus, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  RESERVED: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  CHECKED_OUT: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  MAINTENANCE: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

export function StatusBadge({ status }: { status: EquipmentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${styles[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {statusLabels[status]}
    </span>
  )
}
