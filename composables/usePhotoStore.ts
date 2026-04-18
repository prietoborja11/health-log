const DB_NAME = 'healthlog-photos'
const STORE = 'photos'

let dbPromise: Promise<IDBDatabase> | null = null

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB no disponible'))
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Error al abrir IndexedDB'))
  })
  return dbPromise
}

const tx = async (mode: IDBTransactionMode): Promise<IDBObjectStore> => {
  const db = await openDB()
  return db.transaction(STORE, mode).objectStore(STORE)
}

const resizeToDataUrl = (file: File, maxSize = 1024, quality = 0.72): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img
      const scale = Math.min(1, maxSize / Math.max(width, height))
      const w = Math.round(width * scale)
      const h = Math.round(height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Sin contexto canvas'))
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Imagen no válida'))
    }
    img.src = url
  })

export const usePhotoStore = () => {
  const save = async (id: string, file: File): Promise<string> => {
    const dataUrl = await resizeToDataUrl(file)
    const store = await tx('readwrite')
    return new Promise<string>((resolve, reject) => {
      const req = store.put(dataUrl, id)
      req.onsuccess = () => resolve(id)
      req.onerror = () => reject(req.error ?? new Error('Error al guardar'))
    })
  }

  const load = async (id: string): Promise<string | null> => {
    try {
      const store = await tx('readonly')
      return await new Promise<string | null>((resolve, reject) => {
        const req = store.get(id)
        req.onsuccess = () => resolve((req.result as string | undefined) ?? null)
        req.onerror = () => reject(req.error ?? new Error('Error al leer'))
      })
    } catch {
      return null
    }
  }

  const remove = async (id: string): Promise<void> => {
    try {
      const store = await tx('readwrite')
      await new Promise<void>((resolve, reject) => {
        const req = store.delete(id)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error ?? new Error('Error al borrar'))
      })
    } catch {}
  }

  return { save, load, remove }
}
