import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import type { AppPath } from '../lib/navigation'

interface AppLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: AppPath
  onNavigate: (path: AppPath) => void
  onNavigated?: () => void
}

export function AppLink({ to, onNavigate, onNavigated, onClick, ...props }: AppLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || !isPlainLeftClick(event)) {
      return
    }

    event.preventDefault()
    onNavigate(to)
    onNavigated?.()
  }

  return <a href={to} onClick={handleClick} {...props} />
}

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    event.currentTarget.target !== '_blank'
  )
}
