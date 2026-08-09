const ERROR_MESSAGES: Record<string, string> = {
  role: 'Ihr GitLab-Konto ist keiner LabFlow-Rolle zugeordnet.',
  session: 'Die SSO-Anmeldung ist abgelaufen. Bitte starten Sie sie erneut.',
  client: 'Die GitLab-SSO-Verbindung ist nicht korrekt konfiguriert.',
  token: 'Das von GitLab ausgestellte Anmeldetoken konnte nicht validiert werden.',
  provider: 'Die SSO-Anmeldung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.',
}

export function oidcLoginError(search: string): string | null {
  const parameters = new URLSearchParams(search)
  if (parameters.get('login') !== 'oidc_error') {
    return null
  }

  const message = ERROR_MESSAGES[parameters.get('reason') ?? ''] ?? ERROR_MESSAGES.provider
  const reference = parameters.get('reference')
  return isReference(reference) ? `${message} Referenz: ${reference}` : message
}

function isReference(value: string | null): value is string {
  return (
    value !== null &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  )
}
