export interface FoodResult {
  name: string
  brand?: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  nutriScore?: string
  nova?: number
  defaultServingG?: number | null
  code?: string
}

interface OffProduct {
  code?: string
  product_name?: string
  product_name_es?: string
  brands?: string
  nutriments?: Record<string, number | undefined>
  nutriscore_grade?: string
  nova_group?: number
  serving_quantity?: number | string
}

const FIELDS =
  'code,product_name,product_name_es,brands,nutriments,nutriscore_grade,nova_group,serving_quantity'

const pickName = (p: OffProduct): string =>
  p.product_name_es || p.product_name || ''

const numOrNull = (v: number | undefined): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : null

const toResult = (p: OffProduct): FoodResult => {
  const n = p.nutriments ?? {}
  const serving = p.serving_quantity
  const servingNum =
    typeof serving === 'number' ? serving : typeof serving === 'string' ? Number(serving) : NaN
  return {
    code: p.code,
    name: pickName(p),
    brand: p.brands,
    calories: numOrNull(n['energy-kcal_100g']),
    protein: numOrNull(n['proteins_100g']),
    carbs: numOrNull(n['carbohydrates_100g']),
    fat: numOrNull(n['fat_100g']),
    nutriScore: p.nutriscore_grade,
    nova: p.nova_group,
    defaultServingG: Number.isFinite(servingNum) && servingNum > 0 ? servingNum : null,
  }
}

export const useFoodSearch = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const results = ref<FoodResult[]>([])

  const search = async (query: string) => {
    const q = query.trim()
    if (!q) {
      results.value = []
      return
    }
    loading.value = true
    error.value = null
    try {
      const url =
        'https://world.openfoodfacts.org/api/v2/search' +
        `?search_terms=${encodeURIComponent(q)}` +
        `&fields=${FIELDS}` +
        '&page_size=8&lang=es'
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as { products?: OffProduct[] }
      results.value = (json.products ?? [])
        .filter((p) => pickName(p))
        .map(toResult)
        .filter(
          (r) =>
            r.calories != null || r.protein != null || r.carbs != null || r.fat != null,
        )
    } catch (e) {
      error.value = (e as Error).message || 'Error al buscar'
      results.value = []
    } finally {
      loading.value = false
    }
  }

  const getByBarcode = async (code: string): Promise<FoodResult | null> => {
    loading.value = true
    error.value = null
    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}?fields=${FIELDS}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as { product?: OffProduct; status?: number }
      if (!json.product) {
        error.value = 'Producto no encontrado'
        return null
      }
      const r = toResult(json.product)
      if (!r.name) {
        error.value = 'Producto sin nombre'
        return null
      }
      return r
    } catch (e) {
      error.value = (e as Error).message || 'Error al buscar'
      return null
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    results.value = []
    error.value = null
  }

  return { loading, error, results, search, getByBarcode, reset }
}
