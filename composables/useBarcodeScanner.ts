declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): {
        detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>
      }
      getSupportedFormats?(): Promise<string[]>
    }
  }
}

export const isBarcodeSupported = (): boolean =>
  typeof window !== 'undefined' && typeof window.BarcodeDetector === 'function'

export const useBarcodeScanner = () => {
  const active = ref(false)
  const error = ref<string | null>(null)
  const stream = ref<MediaStream | null>(null)
  const video = ref<HTMLVideoElement | null>(null)
  let rafId: number | null = null
  let detector: InstanceType<NonNullable<typeof window.BarcodeDetector>> | null = null

  const stop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    if (stream.value) {
      for (const track of stream.value.getTracks()) track.stop()
      stream.value = null
    }
    if (video.value) {
      video.value.srcObject = null
    }
    active.value = false
  }

  const start = async (
    videoEl: HTMLVideoElement,
    onDetect: (code: string) => void,
  ): Promise<void> => {
    error.value = null
    if (!isBarcodeSupported()) {
      error.value = 'Escáner no soportado en este navegador'
      return
    }
    try {
      detector = new window.BarcodeDetector!({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
      })
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      stream.value = media
      video.value = videoEl
      videoEl.srcObject = media
      await videoEl.play()
      active.value = true

      let lastCode = ''
      const tick = async () => {
        if (!active.value || !detector || !video.value) return
        try {
          const codes = await detector.detect(video.value)
          if (codes.length && codes[0].rawValue && codes[0].rawValue !== lastCode) {
            lastCode = codes[0].rawValue
            onDetect(lastCode)
          }
        } catch {}
        rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    } catch (e) {
      error.value = (e as Error).message || 'No se pudo acceder a la cámara'
      stop()
    }
  }

  return { active, error, start, stop }
}
