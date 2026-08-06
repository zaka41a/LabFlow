const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(value: string) {
  return dateFormatter.format(toDate(value))
}

export function formatDateTime(value: string) {
  return dateTimeFormatter.format(toDate(value))
}

export function formatDateRange(from: string, until: string) {
  return `${formatDate(from)} – ${formatDate(until)}`
}

function toDate(value: string) {
  const normalized = value.length === 10 ? `${value}T12:00:00` : value
  const date = new Date(normalized)

  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid date value: ${value}`)
  }

  return date
}
