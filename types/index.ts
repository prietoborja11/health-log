export interface Meal {
  id: string
  mealType: MealType
  name: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  portionGrams: number | null
  photoId: string | null
  date: string
  notes: string
}

export type MealType =
  | 'Desayuno'
  | 'Almuerzo'
  | 'Merienda'
  | 'Cena'
  | 'Snack'
  | 'Pre-entreno'
  | 'Post-entreno'

export interface ExerciseSet {
  weight: number | null
  reps: number | null
}

export interface Exercise {
  id: string
  category: ExerciseCategory
  name: string
  duration: number | null
  intensity: 1 | 2 | 3 | 4 | 5
  caloriesBurned: number | null
  sets: ExerciseSet[] | null
  steps: number | null
  distance: number | null
  date: string
  notes: string
}

export type ExerciseCategory =
  | 'Cardio'
  | 'Fuerza'
  | 'HIIT'
  | 'Flexibilidad'
  | 'Deportes'
  | 'Caminata'
  | 'Pasos'
  | 'Natación'
  | 'Yoga'
  | 'Ciclismo'
  | 'Otro'

export interface BodyEntry {
  id: string
  date: string
  weight: number | null
  waist: number | null
  hips: number | null
  chest: number | null
  leftArm: number | null
  rightArm: number | null
  leftLeg: number | null
  rightLeg: number | null
  sleepHours: number | null
  sleepQuality: 1 | 2 | 3 | 4 | 5
  notes: string
}

export interface WaterEntry {
  id: string
  date: string
  amount: number
}

export interface MealTemplateItem {
  mealType: MealType
  name: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  portionGrams: number | null
  notes: string
}

export interface MealTemplate {
  id: string
  name: string
  items: MealTemplateItem[]
}

export type Sex = 'M' | 'F' | ''

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'veryActive'
  | ''

export interface Profile {
  name: string
  height: number | null
  age: number | null
  sex: Sex
  activity: ActivityLevel
  goalCalories: number | null
  goalProtein: number | null
  goalSleep: number | null
  goalWater: number | null
  goal: string
}

export interface DayStats {
  date: string
  label: string
  calIn: number
  calOut: number
  protein: number
  weight: number | null
  sleep: number | null
  water: number
}

export type ModalType = 'meal' | 'exercise' | 'body' | 'profile' | null
