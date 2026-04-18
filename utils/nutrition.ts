import type { ActivityLevel, Sex } from '~/types'

export interface TdeeInput {
  weightKg: number
  heightCm: number
  age: number
  sex: Sex
  activity: ActivityLevel
}

export interface TdeeResult {
  bmr: number
  tdee: number
  activityFactor: number
}

export const ACTIVITY_FACTORS: Record<Exclude<ActivityLevel, ''>, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
}

export const ACTIVITY_LABELS: Record<Exclude<ActivityLevel, ''>, string> = {
  sedentary: 'Sedentario (sin ejercicio)',
  light: 'Ligero (1-3 días/sem)',
  moderate: 'Moderado (3-5 días/sem)',
  active: 'Activo (6-7 días/sem)',
  veryActive: 'Muy activo (2× día o físico)',
}

export const mifflinStJeor = (input: TdeeInput): TdeeResult | null => {
  const { weightKg, heightCm, age, sex, activity } = input
  if (!weightKg || !heightCm || !age || !sex || !activity) return null
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  const bmr = Math.round(sex === 'M' ? base + 5 : base - 161)
  const factor = ACTIVITY_FACTORS[activity]
  return {
    bmr,
    activityFactor: factor,
    tdee: Math.round(bmr * factor),
  }
}

export const goalKcalAdjustment = (
  tdee: number,
  goal: string,
): { target: number; note: string } => {
  switch (goal) {
    case 'perder peso':
      return { target: Math.round(tdee - 400), note: 'Déficit ~400 kcal (perder ~0.4 kg/sem)' }
    case 'ganar músculo':
      return { target: Math.round(tdee + 300), note: 'Superávit ~300 kcal (ganar ~0.3 kg/sem)' }
    case 'mantener peso':
      return { target: tdee, note: 'Mantener TDEE' }
    case 'mejorar resistencia':
      return { target: Math.round(tdee + 100), note: 'Ligero superávit para soportar entrenos' }
    default:
      return { target: tdee, note: 'Sin ajuste por objetivo' }
  }
}

export const suggestMacros = (
  targetKcal: number,
  weightKg: number,
  goal: string,
): { protein: number; carbs: number; fat: number } => {
  const proteinPerKg = goal === 'ganar músculo' ? 2.0 : goal === 'perder peso' ? 2.2 : 1.8
  const protein = Math.round(weightKg * proteinPerKg)
  const fat = Math.round((targetKcal * 0.25) / 9)
  const remaining = targetKcal - protein * 4 - fat * 9
  const carbs = Math.max(0, Math.round(remaining / 4))
  return { protein, carbs, fat }
}

export const scaleMacrosByGrams = (
  per100: { calories: number | null; protein: number | null; carbs: number | null; fat: number | null },
  grams: number,
) => {
  const f = grams / 100
  const round1 = (n: number | null): number | null => (n == null ? null : Math.round(n * f * 10) / 10)
  return {
    calories: per100.calories == null ? null : Math.round(per100.calories * f),
    protein: round1(per100.protein),
    carbs: round1(per100.carbs),
    fat: round1(per100.fat),
  }
}

export const nutriScoreColor: Record<string, string> = {
  a: '#038141',
  b: '#85bb2f',
  c: '#fecb02',
  d: '#ee8100',
  e: '#e63e11',
}

export const novaLabel = (g: number | undefined): string => {
  if (!g) return ''
  if (g === 1) return 'NOVA 1 — no procesado'
  if (g === 2) return 'NOVA 2 — ingrediente culinario'
  if (g === 3) return 'NOVA 3 — procesado'
  if (g === 4) return 'NOVA 4 — ultraprocesado'
  return ''
}
