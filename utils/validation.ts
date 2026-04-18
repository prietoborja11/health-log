import { isValidDateStr } from '~/utils/dates'
import type {
  Meal,
  Exercise,
  BodyEntry,
  ExerciseSet,
  MealType,
  ExerciseCategory,
  WaterEntry,
} from '~/types'

const MEAL_TYPES: MealType[] = [
  'Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack', 'Pre-entreno', 'Post-entreno',
]
const EX_CATS: ExerciseCategory[] = [
  'Cardio', 'Fuerza', 'HIIT', 'Flexibilidad',
  'Deportes', 'Caminata', 'Pasos', 'Natación', 'Yoga', 'Ciclismo', 'Otro',
]

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const num = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)

const clamp15 = (v: unknown): 1 | 2 | 3 | 4 | 5 => {
  const n = Number(v)
  if (n >= 1 && n <= 5 && Number.isInteger(n)) return n as 1 | 2 | 3 | 4 | 5
  return 3
}

export const validateMeal = (v: unknown): Meal | null => {
  if (!isObj(v)) return null
  if (!isValidDateStr(v.date)) return null
  if (typeof v.name !== 'string' || !v.name.trim()) return null
  const mealType = MEAL_TYPES.includes(v.mealType as MealType) ? (v.mealType as MealType) : 'Snack'
  return {
    id: str(v.id) || Math.random().toString(36).slice(2),
    mealType,
    name: v.name,
    calories: num(v.calories),
    protein: num(v.protein),
    carbs: num(v.carbs),
    fat: num(v.fat),
    portionGrams: num(v.portionGrams),
    photoId: typeof v.photoId === 'string' ? v.photoId : null,
    date: v.date as string,
    notes: str(v.notes),
  }
}

const validateSets = (v: unknown): ExerciseSet[] | null => {
  if (v === null || v === undefined) return null
  if (!Array.isArray(v)) return null
  const out: ExerciseSet[] = []
  for (const s of v) {
    if (!isObj(s)) continue
    out.push({ weight: num(s.weight), reps: num(s.reps) })
  }
  return out.length ? out : null
}

export const validateExercise = (v: unknown): Exercise | null => {
  if (!isObj(v)) return null
  if (!isValidDateStr(v.date)) return null
  if (typeof v.name !== 'string' || !v.name.trim()) return null
  const category = EX_CATS.includes(v.category as ExerciseCategory)
    ? (v.category as ExerciseCategory)
    : 'Otro'
  return {
    id: str(v.id) || Math.random().toString(36).slice(2),
    category,
    name: v.name,
    duration: num(v.duration),
    intensity: clamp15(v.intensity),
    caloriesBurned: num(v.caloriesBurned),
    sets: validateSets(v.sets),
    steps: num(v.steps),
    distance: num(v.distance),
    date: v.date as string,
    notes: str(v.notes),
  }
}

export const validateBody = (v: unknown): BodyEntry | null => {
  if (!isObj(v)) return null
  if (!isValidDateStr(v.date)) return null
  return {
    id: str(v.id) || Math.random().toString(36).slice(2),
    date: v.date as string,
    weight: num(v.weight),
    waist: num(v.waist),
    hips: num(v.hips),
    chest: num(v.chest),
    leftArm: num(v.leftArm),
    rightArm: num(v.rightArm),
    leftLeg: num(v.leftLeg),
    rightLeg: num(v.rightLeg),
    sleepHours: num(v.sleepHours),
    sleepQuality: clamp15(v.sleepQuality),
    notes: str(v.notes),
  }
}

export const validateWater = (v: unknown): WaterEntry | null => {
  if (!isObj(v)) return null
  if (!isValidDateStr(v.date)) return null
  const amount = num(v.amount)
  if (amount == null || amount <= 0) return null
  return {
    id: str(v.id) || Math.random().toString(36).slice(2),
    date: v.date as string,
    amount,
  }
}
