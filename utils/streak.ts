import type { DayStats, Profile } from '~/types'
import { todayStr } from '~/utils/dates'

export interface PerfectDayCriteria {
  kcalInRange: boolean
  proteinOk: boolean
  waterOk: boolean
  exerciseOk: boolean
}

export interface PerfectDayStatus {
  criteria: PerfectDayCriteria
  met: number
  total: number
  isPerfect: boolean
}

const KCAL_TOLERANCE = 0.15

export const perfectDayStatus = (
  stats: DayStats,
  profile: Profile,
  exercisesCount: number,
): PerfectDayStatus => {
  const goalCal = Number(profile.goalCalories) || 0
  const goalProt = Number(profile.goalProtein) || 0
  const goalWater = Number(profile.goalWater) || 0

  const kcalInRange =
    goalCal > 0 &&
    stats.calIn >= goalCal * (1 - KCAL_TOLERANCE) &&
    stats.calIn <= goalCal * (1 + KCAL_TOLERANCE)
  const proteinOk = goalProt > 0 && stats.protein >= goalProt * 0.9
  const waterOk = goalWater > 0 && stats.water >= goalWater * 0.9
  const exerciseOk = exercisesCount > 0

  const criteria: PerfectDayCriteria = { kcalInRange, proteinOk, waterOk, exerciseOk }
  const met = Object.values(criteria).filter(Boolean).length
  return { criteria, met, total: 4, isPerfect: met === 4 }
}

export const loggingStreak = (hasDataByDate: (date: string) => boolean, maxLookBack = 400): number => {
  let streak = 0
  const d = new Date()
  for (let i = 0; i < maxLookBack; i++) {
    const iso = d.toISOString().split('T')[0]
    if (hasDataByDate(iso)) {
      streak++
    } else if (iso !== todayStr()) {
      break
    }
    d.setDate(d.getDate() - 1)
  }
  return streak
}
