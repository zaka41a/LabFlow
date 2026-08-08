import { labLabel, typeLabels } from '../lib/labels'
import type { Equipment } from '../lib/types'
import { AccessPolicyBadge } from './AccessPolicyBadge'
import { Icon } from './Icon'
import { StatusBadge } from './StatusBadge'

interface EquipmentTableProps {
  equipment: Equipment[]
  onSelect?: (equipment: Equipment) => void
}

export function EquipmentTable({ equipment, onSelect }: EquipmentTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3.5">Gerät</th>
              <th className="px-5 py-3.5">Typ</th>
              <th className="px-5 py-3.5">Labor</th>
              <th className="px-5 py-3.5">Zugang</th>
              <th className="px-5 py-3.5">Status</th>
              {onSelect && (
                <th className="px-5 py-3.5">
                  <span className="sr-only">Aktion</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {equipment.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt=""
                      width="64"
                      height="48"
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-16 shrink-0 rounded-md border border-slate-200 bg-slate-50 object-cover"
                    />
                    <div>
                      <div className="font-semibold text-ink-950">{item.name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{item.serialNumber}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                  {typeLabels[item.type]}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-600">
                  {labLabel(item.labId)}
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  <AccessPolicyBadge policy={item.accessPolicy} />
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  <StatusBadge status={item.status} />
                </td>
                {onSelect && (
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className="rounded-md border border-transparent p-2 text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-brand-700"
                      aria-label={`${item.name} öffnen`}
                    >
                      <Icon name="arrow" className="size-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
