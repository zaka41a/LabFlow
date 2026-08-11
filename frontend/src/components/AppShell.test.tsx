import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../lib/types'
import { AppShell } from './AppShell'

const borrower: AuthenticatedUser = {
  id: '10000000-0000-0000-0000-000000000001',
  username: 'borrower@labflow.local',
  displayName: 'Zakaria Sabiri',
  labId: 'FH_AACHEN',
  labName: 'Labor FH Aachen',
  roles: ['BORROWER'],
  sessionTimeoutSeconds: 1_800,
}

describe('AppShell', () => {
  it('shows only the navigation assigned to the current role', () => {
    render(
      <AppShell
        activePath="/"
        user={borrower}
        loggingOut={false}
        onLogout={vi.fn()}
        onNavigate={vi.fn()}
      >
        <p>Arbeitsinhalt</p>
      </AppShell>,
    )

    const navigation = screen.getByRole('navigation', { name: 'Hauptnavigation' })
    expect(navigation).toHaveTextContent('Übersicht')
    expect(navigation).toHaveTextContent('Gerätebestand')
    expect(navigation).toHaveTextContent('Meine Anträge')
    expect(navigation).not.toHaveTextContent('Freigaben')
    expect(navigation).not.toHaveTextContent('Ausgabe und Rückgabe')
  })

  it('marks the active destination and forwards navigation', () => {
    const onNavigate = vi.fn()
    render(
      <AppShell
        activePath="/equipment"
        user={borrower}
        loggingOut={false}
        onLogout={vi.fn()}
        onNavigate={onNavigate}
      >
        <p>Arbeitsinhalt</p>
      </AppShell>,
    )

    const equipmentLink = screen.getByRole('link', { name: 'Gerätebestand' })
    expect(equipmentLink).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByRole('link', { name: 'Meine Anträge' }))
    expect(onNavigate).toHaveBeenCalledWith('/requests')
  })

  it('provides account details and a working logout action', () => {
    const onLogout = vi.fn()
    render(
      <AppShell
        activePath="/"
        user={borrower}
        loggingOut={false}
        onLogout={onLogout}
        onNavigate={vi.fn()}
      >
        <p>Arbeitsinhalt</p>
      </AppShell>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Benutzermenü für Zakaria Sabiri' }))
    expect(screen.getByRole('menu')).toHaveTextContent('borrower@labflow.local')
    expect(screen.getByRole('menu')).toHaveTextContent('Borrower')

    fireEvent.click(screen.getByRole('menuitem', { name: 'Abmelden' }))
    expect(onLogout).toHaveBeenCalledOnce()
  })
})
