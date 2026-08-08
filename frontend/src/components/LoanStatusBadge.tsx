import { loanStatusLabels } from '../lib/labels'
import type { LoanStatus } from '../lib/types'

const statusStyles: Record<LoanStatus, string> = {
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-700',
  SUBMITTED: 'border-brand-200 bg-brand-50 text-brand-700',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  CANCELLED: 'border-slate-200 bg-slate-100 text-slate-600',
  CHECKED_OUT: 'border-brand-200 bg-brand-50 text-brand-800',
  RETURNED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {loanStatusLabels[status]}
    </span>
  )
}
