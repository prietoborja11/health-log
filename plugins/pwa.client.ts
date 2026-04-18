export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  if (import.meta.dev) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => null)
  })
})
