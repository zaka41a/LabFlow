import { describe, expect, it } from 'vitest'
import { oidcLoginError } from './oidcLoginError'

describe('oidcLoginError', () => {
  it('returns no message outside an OIDC callback failure', () => {
    expect(oidcLoginError('')).toBeNull()
    expect(oidcLoginError('?login=local_error')).toBeNull()
  })

  it('explains a missing GitLab role assignment', () => {
    expect(oidcLoginError('?login=oidc_error&reason=role')).toBe(
      'Ihr GitLab-Konto ist keiner LabFlow-Rolle zugeordnet.',
    )
  })

  it('identifies a GitLab client configuration error', () => {
    expect(oidcLoginError('?login=oidc_error&reason=client')).toBe(
      'Die GitLab-SSO-Verbindung ist nicht korrekt konfiguriert.',
    )
  })

  it('includes only a valid diagnostic reference', () => {
    expect(
      oidcLoginError(
        '?login=oidc_error&reason=provider&reference=4d9fbfad-8ed0-4013-8fbb-360193449190',
      ),
    ).toContain('Referenz: 4d9fbfad-8ed0-4013-8fbb-360193449190')
    expect(
      oidcLoginError('?login=oidc_error&reason=provider&reference=provider-secret'),
    ).not.toContain('provider-secret')
  })
})
