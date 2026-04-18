import { defineStore } from 'pinia'
import type {
  Meal,
  Exercise,
  BodyEntry,
  Profile,
  DayStats,
  WaterEntry,
  MealTemplate,
  MealTemplateItem,
} from '~/types'
import { uid, sumField } from '~/utils/calculations'
import { todayStr, last7Days, dayLabel, yesterdayStr } from '~/utils/dates'
import { validateMeal, validateExercise, validateBody, validateWater } from '~/utils/validation'
import { usePhotoStore } from '~/composables/usePhotoStore'

const KEYS = {
  meals: 'hl_meals',
  exercises: 'hl_exercises',
  body: 'hl_body',
  water: 'hl_water',
  profile: 'hl_profile',
  templates: 'hl_templates',
}

const loadLS = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const saveLS = (key: string, data: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {}
}

const DEFAULT_PROFILE: Profile = {
  name: '',
  height: null,
  age: null,
  sex: '',
  activity: '',
  goalCalories: 2000,
  goalProtein: 150,
  goalSleep: 8,
  goalWater: 2500,
  goal: '',
}

export const useAppStore = defineStore('app', () => {
  const meals = ref<Meal[]>([])
  const exercises = ref<Exercise[]>([])
  const body = ref<BodyEntry[]>([])
  const water = ref<WaterEntry[]>([])
  const templates = ref<MealTemplate[]>([])
  const profile = ref<Profile>({ ...DEFAULT_PROFILE })

  const init = () => {
    meals.value = loadLS<Meal[]>(KEYS.meals, [])
    exercises.value = loadLS<Exercise[]>(KEYS.exercises, [])
    body.value = loadLS<BodyEntry[]>(KEYS.body, [])
    water.value = loadLS<WaterEntry[]>(KEYS.water, [])
    templates.value = loadLS<MealTemplate[]>(KEYS.templates, [])
    profile.value = { ...DEFAULT_PROFILE, ...loadLS<Partial<Profile>>(KEYS.profile, {}) }
  }

  // Meals
  const addMeal = (data: Omit<Meal, 'id'>) => {
    meals.value.push({ ...data, id: uid() })
    saveLS(KEYS.meals, meals.value)
  }
  const updateMeal = (id: string, data: Omit<Meal, 'id'>) => {
    const i = meals.value.findIndex((m) => m.id === id)
    if (i !== -1) {
      meals.value[i] = { ...data, id }
      saveLS(KEYS.meals, meals.value)
    }
  }
  const deleteMeal = (id: string): Meal | null => {
    const i = meals.value.findIndex((m) => m.id === id)
    if (i === -1) return null
    const [removed] = meals.value.splice(i, 1)
    saveLS(KEYS.meals, meals.value)
    if (removed?.photoId) {
      usePhotoStore().remove(removed.photoId).catch(() => null)
    }
    return removed
  }
  const restoreMeal = (meal: Meal) => {
    if (meals.value.some((m) => m.id === meal.id)) return
    meals.value.push(meal)
    saveLS(KEYS.meals, meals.value)
  }
  const copyMealsFromYesterday = () => {
    const copies = meals.value
      .filter((m) => m.date === yesterdayStr())
      .map((m) => ({ ...m, id: uid(), date: todayStr(), photoId: null }))
    if (!copies.length) return 0
    meals.value.push(...copies)
    saveLS(KEYS.meals, meals.value)
    return copies.length
  }

  // Exercises
  const addExercise = (data: Omit<Exercise, 'id'>) => {
    exercises.value.push({ ...data, id: uid() })
    saveLS(KEYS.exercises, exercises.value)
  }
  const updateExercise = (id: string, data: Omit<Exercise, 'id'>) => {
    const i = exercises.value.findIndex((e) => e.id === id)
    if (i !== -1) {
      exercises.value[i] = { ...data, id }
      saveLS(KEYS.exercises, exercises.value)
    }
  }
  const deleteExercise = (id: string): Exercise | null => {
    const i = exercises.value.findIndex((e) => e.id === id)
    if (i === -1) return null
    const [removed] = exercises.value.splice(i, 1)
    saveLS(KEYS.exercises, exercises.value)
    return removed
  }
  const restoreExercise = (ex: Exercise) => {
    if (exercises.value.some((e) => e.id === ex.id)) return
    exercises.value.push(ex)
    saveLS(KEYS.exercises, exercises.value)
  }

  // Body
  const addBodyEntry = (data: Omit<BodyEntry, 'id'>) => {
    body.value.push({ ...data, id: uid() })
    saveLS(KEYS.body, body.value)
  }
  const updateBodyEntry = (id: string, data: Omit<BodyEntry, 'id'>) => {
    const i = body.value.findIndex((b) => b.id === id)
    if (i !== -1) {
      body.value[i] = { ...data, id }
      saveLS(KEYS.body, body.value)
    }
  }
  const deleteBodyEntry = (id: string): BodyEntry | null => {
    const i = body.value.findIndex((b) => b.id === id)
    if (i === -1) return null
    const [removed] = body.value.splice(i, 1)
    saveLS(KEYS.body, body.value)
    return removed
  }
  const restoreBodyEntry = (entry: BodyEntry) => {
    if (body.value.some((b) => b.id === entry.id)) return
    body.value.push(entry)
    saveLS(KEYS.body, body.value)
  }

  // Templates
  const addTemplate = (name: string, items: MealTemplateItem[]): MealTemplate | null => {
    if (!name.trim() || !items.length) return null
    const tpl: MealTemplate = { id: uid(), name: name.trim(), items }
    templates.value.push(tpl)
    saveLS(KEYS.templates, templates.value)
    return tpl
  }
  const deleteTemplate = (id: string) => {
    templates.value = templates.value.filter((t) => t.id !== id)
    saveLS(KEYS.templates, templates.value)
  }
  const applyTemplate = (id: string, date: string = todayStr()): number => {
    const tpl = templates.value.find((t) => t.id === id)
    if (!tpl) return 0
    const now: Meal[] = tpl.items.map((it) => ({
      ...it,
      id: uid(),
      date,
      photoId: null,
    }))
    meals.value.push(...now)
    saveLS(KEYS.meals, meals.value)
    return now.length
  }
  const saveTodayAsTemplate = (name: string, date: string = todayStr()): MealTemplate | null => {
    const todayList = meals.value.filter((m) => m.date === date)
    if (!todayList.length) return null
    const items: MealTemplateItem[] = todayList.map((m) => ({
      mealType: m.mealType,
      name: m.name,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      portionGrams: m.portionGrams,
      notes: m.notes,
    }))
    return addTemplate(name, items)
  }

  // Water
  const addWater = (amount: number, date: string = todayStr()) => {
    if (amount <= 0) return
    water.value.push({ id: uid(), date, amount })
    saveLS(KEYS.water, water.value)
  }
  const deleteWater = (id: string): WaterEntry | null => {
    const i = water.value.findIndex((w) => w.id === id)
    if (i === -1) return null
    const [removed] = water.value.splice(i, 1)
    saveLS(KEYS.water, water.value)
    return removed
  }
  const restoreWater = (entry: WaterEntry) => {
    if (water.value.some((w) => w.id === entry.id)) return
    water.value.push(entry)
    saveLS(KEYS.water, water.value)
  }

  // Profile
  const updateProfile = (data: Profile) => {
    profile.value = data
    saveLS(KEYS.profile, data)
  }

  // Backup / restore
  const exportAll = () => ({
    version: 3,
    exportedAt: new Date().toISOString(),
    profile: profile.value,
    meals: meals.value,
    exercises: exercises.value,
    body: body.value,
    water: water.value,
    templates: templates.value,
  })

  const importAll = (
    data: unknown,
  ): {
    ok: boolean
    error?: string
    imported?: { meals: number; exercises: number; body: number; water: number; dropped: number }
  } => {
    if (!data || typeof data !== 'object') return { ok: false, error: 'Formato inválido' }
    const d = data as Partial<ReturnType<typeof exportAll>>
    if (!Array.isArray(d.meals) || !Array.isArray(d.exercises) || !Array.isArray(d.body)) {
      return { ok: false, error: 'Faltan datos (meals/exercises/body)' }
    }
    let dropped = 0
    const validMeals: Meal[] = []
    for (const m of d.meals) {
      const v = validateMeal(m)
      if (v) validMeals.push(v)
      else dropped++
    }
    const validExercises: Exercise[] = []
    for (const e of d.exercises) {
      const v = validateExercise(e)
      if (v) validExercises.push(v)
      else dropped++
    }
    const validBody: BodyEntry[] = []
    for (const b of d.body) {
      const v = validateBody(b)
      if (v) validBody.push(v)
      else dropped++
    }
    const validWater: WaterEntry[] = []
    if (Array.isArray(d.water)) {
      for (const w of d.water) {
        const v = validateWater(w)
        if (v) validWater.push(v)
        else dropped++
      }
    }

    meals.value = validMeals
    exercises.value = validExercises
    body.value = validBody
    water.value = validWater
    if (Array.isArray(d.templates)) {
      templates.value = (d.templates as MealTemplate[]).filter(
        (t) => t && typeof t.name === 'string' && Array.isArray(t.items),
      )
    }
    if (d.profile && typeof d.profile === 'object') {
      profile.value = { ...DEFAULT_PROFILE, ...(d.profile as Profile) }
    }
    saveLS(KEYS.meals, meals.value)
    saveLS(KEYS.exercises, exercises.value)
    saveLS(KEYS.body, body.value)
    saveLS(KEYS.water, water.value)
    saveLS(KEYS.templates, templates.value)
    saveLS(KEYS.profile, profile.value)
    return {
      ok: true,
      imported: {
        meals: validMeals.length,
        exercises: validExercises.length,
        body: validBody.length,
        water: validWater.length,
        dropped,
      },
    }
  }

  // Derived
  const today = computed(() => todayStr())
  const todayMeals = computed(() => meals.value.filter((m) => m.date === today.value))
  const todayExercises = computed(() => exercises.value.filter((e) => e.date === today.value))
  const todayWater = computed(() =>
    water.value.filter((w) => w.date === today.value).reduce((s, w) => s + w.amount, 0),
  )
  const latestBody = computed<BodyEntry | null>(() =>
    body.value.length ? body.value[body.value.length - 1] : null,
  )

  const todayCalIn = computed(() => sumField(todayMeals.value, 'calories'))
  const todayCalOut = computed(() => sumField(todayExercises.value, 'caloriesBurned'))
  const todayProtein = computed(() => sumField(todayMeals.value, 'protein'))
  const todayCarbs = computed(() => sumField(todayMeals.value, 'carbs'))
  const todayFat = computed(() => sumField(todayMeals.value, 'fat'))
  const todayNet = computed(() => todayCalIn.value - todayCalOut.value)

  const statsForDate = (date: string): DayStats => {
    const dm = meals.value.filter((m) => m.date === date)
    const de = exercises.value.filter((e) => e.date === date)
    const dw = water.value.filter((w) => w.date === date)
    const bodyEntries = body.value.filter((b) => b.date === date)
    const db = bodyEntries.length ? bodyEntries[bodyEntries.length - 1] : null
    return {
      date,
      label: dayLabel(date),
      calIn: sumField(dm, 'calories'),
      calOut: sumField(de, 'caloriesBurned'),
      protein: sumField(dm, 'protein'),
      weight: db?.weight ?? null,
      sleep: db?.sleepHours ?? null,
      water: dw.reduce((s, w) => s + w.amount, 0),
    }
  }

  const weekStats = computed<DayStats[]>(() => last7Days().map(statsForDate))
  const statsForRange = (dates: string[]): DayStats[] => dates.map(statsForDate)

  return {
    meals,
    exercises,
    body,
    water,
    templates,
    profile,
    init,
    addTemplate,
    deleteTemplate,
    applyTemplate,
    saveTodayAsTemplate,
    addMeal,
    updateMeal,
    deleteMeal,
    restoreMeal,
    copyMealsFromYesterday,
    addExercise,
    updateExercise,
    deleteExercise,
    restoreExercise,
    addBodyEntry,
    updateBodyEntry,
    deleteBodyEntry,
    restoreBodyEntry,
    addWater,
    deleteWater,
    restoreWater,
    updateProfile,
    exportAll,
    importAll,
    today,
    todayMeals,
    todayExercises,
    todayWater,
    latestBody,
    todayCalIn,
    todayCalOut,
    todayProtein,
    todayCarbs,
    todayFat,
    todayNet,
    weekStats,
    statsForRange,
    statsForDate,
  }
})
