import { accessPolicyLabels } from '../lib/labels'
import type { EquipmentAccessPolicy } from '../lib/types'
import { Icon } from './Icon'

interface AccessPolicyBadgeProps {
  policy: EquipmentAccessPolicy
}

export function AccessPolicyBadge({ policy }: AccessPolicyBadgeProps) {
  const restricted = policy !== 'OPEN'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        restricted
          ? 'border-brand-200 bg-brand-50 text-brand-800'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}
    >
      <Icon name={restricted ? 'shield' : 'check'} className="size-3.5" />
      {accessPolicyLabels[policy]}
    </span>
  )
}
