const toLocalISO = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const todayStr = (): string => toLocalISO(new Date())

export const yesterdayStr = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toLocalISO(d)
}

export const dayLabel = (dateStr: string): string =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' })

export const last7Days = (): string[] =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return toLocalISO(d)
  })

export const formatDate = (dateStr: string): string =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export const todayLong = (): string =>
  new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

export const lastNDays = (n: number): string[] =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return toLocalISO(d)
  })

export const daysBetween = (from: string, to: string): string[] => {
  const out: string[] = []
  const start = new Date(from + 'T12:00:00')
  const end = new Date(to + 'T12:00:00')
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(toLocalISO(d))
  }
  return out
}

export const isValidDateStr = (s: unknown): s is string =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T12:00:00').getTime())
