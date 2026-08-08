import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import { accessPolicyLabels, typeLabels } from '../../lib/labels'
import type { CreateEquipment, EquipmentAccessPolicy, EquipmentType } from '../../lib/types'

interface CreateEquipmentFormProps {
  labName: string
  pending: boolean
  error: string | null
  onCancel: () => void
  onSubmit: (command: CreateEquipment) => void
}

const maximumImageBytes = 4 * 1024 * 1024

export function CreateEquipmentForm({
  labName,
  pending,
  error,
  onCancel,
  onSubmit,
}: CreateEquipmentFormProps) {
  const [name, setName] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [type, setType] = useState<EquipmentType>('LABORATORY_DEVICE')
  const [accessPolicy, setAccessPolicy] = useState<EquipmentAccessPolicy>('OPEN')
  const [requiredQualification, setRequiredQualification] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const restricted = accessPolicy !== 'OPEN'

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null)
      return
    }
    const nextPreview = URL.createObjectURL(image)
    setPreviewUrl(nextPreview)
    return () => URL.revokeObjectURL(nextPreview)
  }, [image])

  const selectImage = (file: File | undefined) => {
    if (!file) {
      setImage(null)
      setImageError(null)
      return
    }
    if (file.size > maximumImageBytes) {
      setImage(null)
      setImageError('Die Bilddatei darf höchstens 4 MB groß sein.')
      return
    }
    setImage(file)
    setImageError(null)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!image) {
      setImageError('Wählen Sie ein Gerätebild aus.')
      return
    }
    onSubmit({
      name,
      type,
      serialNumber,
      accessPolicy,
      requiredQualification: restricted ? requiredQualification : undefined,
      image,
    })
  }

  return (
    <section
      className="rounded-lg border border-slate-200 bg-white shadow-sm"
      aria-labelledby="new-equipment-title"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
            Bestandsverwaltung
          </p>
          <h2 id="new-equipment-title" className="mt-1 text-lg font-semibold text-ink-950">
            Gerät hinzufügen
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Erfassen Sie Inventardaten, Zugangsregeln und ein eindeutiges Produktbild.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-ink-950"
          aria-label="Formular schließen"
        >
          <Icon name="close" className="size-5" />
        </button>
      </div>

      <form onSubmit={submit} className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div>
          <label className="block text-sm font-semibold text-ink-950" htmlFor="equipment-image">
            Gerätebild
          </label>
          <label
            htmlFor="equipment-image"
            className="mt-2 flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50 text-center hover:border-brand-400 hover:bg-brand-50"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Vorschau des neuen Geräts"
                className="size-full object-cover"
              />
            ) : (
              <span className="px-5 text-sm text-slate-500">
                <Icon name="equipment" className="mx-auto mb-2 size-7 text-brand-700" />
                PNG, JPEG oder WebP auswählen
              </span>
            )}
          </label>
          <input
            id="equipment-image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => selectImage(event.target.files?.[0])}
          />
          <p className="mt-2 truncate text-xs text-slate-500">
            {image ? image.name : 'Maximale Dateigröße: 4 MB'}
          </p>
          {imageError && (
            <p className="mt-2 text-sm font-medium text-rose-700" role="alert">
              {imageError}
            </p>
          )}
        </div>

        <div className="grid content-start gap-5 sm:grid-cols-2">
          <Field label="Gerätename" htmlFor="equipment-name">
            <input
              id="equipment-name"
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="z. B. Präzisionswaage 0,1 mg"
              className={inputClassName}
            />
          </Field>

          <Field label="Inventarnummer" htmlFor="equipment-serial">
            <input
              id="equipment-serial"
              required
              maxLength={64}
              value={serialNumber}
              onChange={(event) => setSerialNumber(event.target.value)}
              placeholder="z. B. BIO-2026-044"
              className={inputClassName}
            />
          </Field>

          <Field label="Gerätetyp" htmlFor="equipment-type">
            <select
              id="equipment-type"
              value={type}
              onChange={(event) => setType(event.target.value as EquipmentType)}
              className={inputClassName}
            >
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Labor" htmlFor="equipment-lab">
            <input
              id="equipment-lab"
              readOnly
              value={labName}
              className={`${inputClassName} cursor-not-allowed bg-slate-100 text-slate-600`}
            />
          </Field>

          <Field label="Zugang" htmlFor="equipment-access">
            <select
              id="equipment-access"
              value={accessPolicy}
              onChange={(event) => setAccessPolicy(event.target.value as EquipmentAccessPolicy)}
              className={inputClassName}
            >
              {Object.entries(accessPolicyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          {restricted && (
            <Field
              label="Erforderlicher Nachweis"
              htmlFor="equipment-qualification"
              className="sm:col-span-2"
            >
              <textarea
                id="equipment-qualification"
                required
                maxLength={300}
                rows={3}
                value={requiredQualification}
                onChange={(event) => setRequiredQualification(event.target.value)}
                placeholder="Beschreiben Sie die notwendige Unterweisung oder Qualifikation."
                className={inputClassName}
              />
            </Field>
          )}

          {error && (
            <div className="sm:col-span-2" role="alert">
              <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 sm:col-span-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-w-36 items-center justify-center gap-2 rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-wait disabled:opacity-60"
            >
              <Icon name="plus" className="size-4" />
              {pending ? 'Wird gespeichert…' : 'Gerät speichern'}
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}

const inputClassName =
  'mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-ink-950 placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100'

function Field({
  label,
  htmlFor,
  className = '',
  children,
}: {
  label: string
  htmlFor: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={`block text-sm font-semibold text-ink-950 ${className}`} htmlFor={htmlFor}>
      {label}
      {children}
    </label>
  )
}
