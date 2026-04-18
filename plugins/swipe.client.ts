type SwipeEl = HTMLElement & { __swipeCleanup?: () => void }

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('swipe-left', {
    mounted(el: SwipeEl, binding) {
      let startX = 0
      let startY = 0
      let active = false

      const onStart = (e: TouchEvent) => {
        const t = e.touches[0]
        if (!t) return
        startX = t.clientX
        startY = t.clientY
        active = true
      }
      const onEnd = (e: TouchEvent) => {
        if (!active) return
        active = false
        const t = e.changedTouches[0]
        if (!t) return
        const dx = t.clientX - startX
        const dy = t.clientY - startY
        if (dx < -90 && Math.abs(dy) < 40 && typeof binding.value === 'function') {
          binding.value()
        }
      }

      el.addEventListener('touchstart', onStart, { passive: true })
      el.addEventListener('touchend', onEnd, { passive: true })
      el.__swipeCleanup = () => {
        el.removeEventListener('touchstart', onStart)
        el.removeEventListener('touchend', onEnd)
      }
    },
    unmounted(el: SwipeEl) {
      el.__swipeCleanup?.()
    },
  })
})
