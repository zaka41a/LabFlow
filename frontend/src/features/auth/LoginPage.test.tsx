import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('submits the entered credentials', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined)
    render(<LoginPage pending={false} error={null} onLogin={onLogin} />)

    fireEvent.change(screen.getByLabelText('E-Mail-Adresse'), {
      target: { value: 'borrower@labflow.local' },
    })
    fireEvent.change(screen.getByLabelText('Passwort'), {
      target: { value: 'Borrower2026!' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Anmelden' }).closest('form')!)

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith({
        username: 'borrower@labflow.local',
        password: 'Borrower2026!',
      })
    })
  })

  it('can reveal and hide the password without submitting', () => {
    render(<LoginPage pending={false} error={null} onLogin={vi.fn()} />)
    const password = screen.getByLabelText('Passwort')

    expect(password).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Passwort anzeigen' }))
    expect(password).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByRole('button', { name: 'Passwort ausblenden' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('offers the configured OpenID Connect login', () => {
    render(
      <LoginPage
        pending={false}
        error={null}
        onLogin={vi.fn()}
        oidcLoginUrl="/oauth2/authorization/labflow"
      />,
    )

    expect(screen.getByRole('link', { name: 'Mit LabFlow SSO anmelden' })).toHaveAttribute(
      'href',
      '/oauth2/authorization/labflow',
    )
  })
})
