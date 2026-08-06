import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders the German status label', () => {
    render(<StatusBadge status="CHECKED_OUT" />)

    expect(screen.getByText('Ausgeliehen')).toBeInTheDocument()
  })
})
