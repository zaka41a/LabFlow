import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-5 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </header>
  )
}
