import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import type { LoginCredentials } from '../../lib/types'

interface LoginPageProps {
  pending: boolean
  error: string | null
  onLogin: (credentials: LoginCredentials) => Promise<void>
  oidcLoginUrl?: string
}

export function LoginPage({ pending, error, onLogin, oidcLoginUrl }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      await onLogin({
        username: String(data.get('username')),
        password: String(data.get('password')),
      })
    } catch {
      // The parent renders the normalized authentication error.
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <img
              src="/branding/fh-aachen-logo.webp"
              alt="FH Aachen"
              width="320"
              height="94"
              className="h-auto w-40"
            />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Laborverwaltung
          </p>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[27rem]">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-950">Anmeldung</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Geben Sie Ihre Zugangsdaten ein.
            </p>
          </div>

          <form
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <label className="block">
              <span className="text-sm font-medium text-ink-950">E-Mail-Adresse</span>
              <span className="relative mt-2 block">
                <Icon
                  name="mail"
                  className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="username"
                  type="email"
                  autoComplete="username"
                  required
                  autoFocus
                  placeholder="name@labflow.local"
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm text-ink-950 placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                />
              </span>
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-ink-950">Passwort</span>
              <span className="relative mt-2 block">
                <Icon
                  name="lock"
                  className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Ihr Passwort"
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-11 text-sm text-ink-950 placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-ink-950"
                  aria-label={showPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} className="size-5" />
                </button>
              </span>
            </label>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-semibold leading-5 text-rose-800"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-wait disabled:opacity-65"
            >
              {pending ? 'Anmeldung läuft…' : 'Anmelden'}
            </button>

            {oidcLoginUrl && (
              <>
                <div className="my-5 flex items-center gap-3" aria-hidden="true">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    oder
                  </span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <a
                  href={oidcLoginUrl}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-ink-950 hover:border-brand-300 hover:bg-brand-50"
                >
                  <Icon name="shield" className="size-4 text-brand-700" />
                  Mit LabFlow SSO anmelden
                </a>
              </>
            )}

            <div className="mt-6 flex items-start gap-2.5 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
              <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-brand-700" />
              <p>
                Die Sitzung wird serverseitig geschützt und nach Inaktivität automatisch beendet.
              </p>
            </div>
          </form>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 py-4 text-center text-xs text-slate-500">
        FH Aachen · Zugang für autorisierte Personen
      </footer>
    </div>
  )
}

export function SessionLoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-6">
      <div className="rounded-lg border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-ink-950">Sitzung wird geprüft</p>
        <p className="mt-1 text-xs text-slate-500">Einen Moment bitte.</p>
      </div>
    </div>
  )
}
