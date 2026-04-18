export const pearson = (xs: number[], ys: number[]): number | null => {
  if (xs.length !== ys.length || xs.length < 3) return null
  const n = xs.length
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx
    const b = ys[i] - my
    num += a * b
    dx += a * a
    dy += b * b
  }
  const denom = Math.sqrt(dx * dy)
  if (denom === 0) return null
  return num / denom
}

export const interpretPearson = (r: number): { label: string; strength: string; colorClass: string } => {
  const a = Math.abs(r)
  const dir = r >= 0 ? 'positiva' : 'negativa'
  let strength = 'débil'
  let colorClass = 'text-muted'
  if (a >= 0.7) { strength = 'muy fuerte'; colorClass = r >= 0 ? 'text-green' : 'text-red' }
  else if (a >= 0.5) { strength = 'fuerte'; colorClass = r >= 0 ? 'text-green' : 'text-orange' }
  else if (a >= 0.3) { strength = 'moderada'; colorClass = 'text-blue' }
  return { label: `Correlación ${strength} ${dir}`, strength, colorClass }
}
