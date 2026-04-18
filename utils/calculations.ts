export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export const calcBMI = (weight: number, heightCm: number): string => {
  if (!weight || !heightCm || heightCm <= 0) return '–'
  return (weight / Math.pow(heightCm / 100, 2)).toFixed(1)
}

export const bmiCategory = (bmi: number): { label: string; color: string; tailwind: string } => {
  if (bmi < 18.5) return { label: 'Bajo peso', color: '#4f9eff', tailwind: 'text-blue' }
  if (bmi < 25) return { label: 'Normal', color: '#7fff6e', tailwind: 'text-green' }
  if (bmi < 30) return { label: 'Sobrepeso', color: '#ffb347', tailwind: 'text-orange' }
  return { label: 'Obesidad', color: '#ff6b6b', tailwind: 'text-red' }
}

export const intensityLabel = (v: number): string =>
  ['Muy suave', 'Suave', 'Moderado', 'Intenso', 'Máximo'][v - 1] ?? ''

export const sumField = <T>(arr: T[], field: keyof T): number =>
  arr.reduce((sum, item) => sum + (Number(item[field]) || 0), 0)

export const pct = (value: number, goal: number): number =>
  goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0
