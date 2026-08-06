import type { IconName } from './Icon'
import { Icon } from './Icon'

interface StatCardProps {
  label: string
  value: number
  detail: string
  icon: IconName
  tone: 'brand' | 'emerald' | 'amber' | 'sky'
}

const tones = {
  brand: 'bg-brand-50 text-brand-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  sky: 'bg-sky-50 text-sky-700',
}

export function StatCard({ label, value, detail, icon, tone }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-ink-950">{value}</p>
        </div>
        <span className={`grid size-11 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon name={icon} className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{detail}</p>
    </article>
  )
}
