<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <p class="section-label !mb-0">{{ title }}</p>
      <div class="flex items-center gap-1.5 text-[10px] text-muted">
        <span>Menos</span>
        <span v-for="(c, i) in legendColors" :key="i" class="w-2.5 h-2.5 rounded-sm" :style="{ background: c }" />
        <span>Más</span>
      </div>
    </div>
    <div class="flex gap-1 overflow-x-auto">
      <div class="flex flex-col gap-1 text-[9px] text-muted pt-3 pr-1">
        <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
      </div>
      <div class="flex gap-1">
        <div
          v-for="(week, wi) in weeks"
          :key="wi"
          class="flex flex-col gap-1"
        >
          <div
            v-for="(cell, ci) in week"
            :key="ci"
            class="w-3 h-3 rounded-sm cursor-help"
            :style="{ background: cell ? colorFor(cell.value) : 'transparent' }"
            :title="cell ? `${cell.date} · ${Math.round(cell.value * 100)}%` : ''"
          />
        </div>
      </div>
    </div>
    <p class="text-[11px] text-muted">
      {{ summary }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  days: { date: string; value: number }[]
}>()

const legendColors = ['#181828', '#2a4d2a', '#4f8f4f', '#6fc76f', '#7fff6e']

const colorFor = (v: number): string => {
  if (v <= 0) return '#181828'
  if (v < 0.5) return '#2a4d2a'
  if (v < 0.8) return '#4f8f4f'
  if (v < 1) return '#6fc76f'
  return '#7fff6e'
}

const weeks = computed(() => {
  const sorted = [...props.days].sort((a, b) => a.date.localeCompare(b.date))
  if (!sorted.length) return []
  const start = new Date(sorted[0].date + 'T12:00:00')
  const jsDay = start.getDay()
  const mondayOffset = (jsDay + 6) % 7
  start.setDate(start.getDate() - mondayOffset)

  const byDate = new Map(sorted.map((d) => [d.date, d]))
  const end = new Date(sorted[sorted.length - 1].date + 'T12:00:00')
  const cells: Array<Array<{ date: string; value: number } | null>> = []
  let week: Array<{ date: string; value: number } | null> = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().split('T')[0]
    week.push(byDate.get(iso) ?? null)
    if (week.length === 7) {
      cells.push(week)
      week = []
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null)
    cells.push(week)
  }
  return cells
})

const summary = computed(() => {
  const vals = props.days.map((d) => d.value)
  if (!vals.length) return ''
  const logged = vals.filter((v) => v > 0).length
  const streak = (() => {
    let best = 0
    let cur = 0
    for (const v of vals) {
      if (v > 0) {
        cur++
        if (cur > best) best = cur
      } else cur = 0
    }
    return best
  })()
  const rate = Math.round((logged / vals.length) * 100)
  return `${logged}/${vals.length} días registrados · ${rate}% · racha máxima ${streak}`
})
</script>
