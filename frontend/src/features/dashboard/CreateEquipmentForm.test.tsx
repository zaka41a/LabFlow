import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateEquipment } from '../../lib/types'
import { CreateEquipmentForm } from './CreateEquipmentForm'

describe('CreateEquipmentForm', () => {
  beforeEach(() => {
    Object.defineProperties(URL, {
      createObjectURL: {
        configurable: true,
        value: vi.fn(() => 'blob:equipment-preview'),
      },
      revokeObjectURL: {
        configurable: true,
        value: vi.fn(),
      },
    })
  })

  it('submits inventory data, access rules and the selected image', () => {
    const onSubmit = vi.fn()
    const image = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      'laborwaage.png',
      { type: 'image/png' },
    )
    renderForm(onSubmit)

    fireEvent.change(screen.getByLabelText('Gerätename'), {
      target: { value: 'Präzisionswaage 0,1 mg' },
    })
    fireEvent.change(screen.getByLabelText('Inventarnummer'), {
      target: { value: 'BIO-2026-099' },
    })
    fireEvent.change(screen.getByLabelText('Zugang'), {
      target: { value: 'QUALIFICATION_REQUIRED' },
    })
    fireEvent.change(screen.getByLabelText('Erforderlicher Nachweis'), {
      target: { value: 'Einweisung in die Präzisionswaage' },
    })
    fireEvent.change(screen.getByLabelText('Gerätebild'), {
      target: { files: [image] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gerät speichern' }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Präzisionswaage 0,1 mg',
      type: 'LABORATORY_DEVICE',
      serialNumber: 'BIO-2026-099',
      accessPolicy: 'QUALIFICATION_REQUIRED',
      requiredQualification: 'Einweisung in die Präzisionswaage',
      image,
    })
  })

  it('requires an equipment image before submitting', () => {
    const onSubmit = vi.fn()
    renderForm(onSubmit)

    fireEvent.change(screen.getByLabelText('Gerätename'), {
      target: { value: 'Präzisionswaage 0,1 mg' },
    })
    fireEvent.change(screen.getByLabelText('Inventarnummer'), {
      target: { value: 'BIO-2026-099' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gerät speichern' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Wählen Sie ein Gerätebild aus.')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

function renderForm(onSubmit: (command: CreateEquipment) => void) {
  return render(
    <CreateEquipmentForm
      labName="Labor FH Aachen"
      pending={false}
      error={null}
      onCancel={vi.fn()}
      onSubmit={onSubmit}
    />,
  )
}
