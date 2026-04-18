export interface ToastAction {
  label: string
  run: () => void
}

export interface Toast {
  id: string
  message: string
  action?: ToastAction
  variant?: 'info' | 'success' | 'error'
}

const toasts = ref<Toast[]>([])

export const useToast = () => {
  const dismiss = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const push = (
    message: string,
    opts: { action?: ToastAction; variant?: Toast['variant']; duration?: number } = {},
  ) => {
    const id = Math.random().toString(36).slice(2)
    const toast: Toast = { id, message, action: opts.action, variant: opts.variant ?? 'info' }
    toasts.value = [...toasts.value, toast]
    const duration = opts.duration ?? 5000
    if (duration > 0) setTimeout(() => dismiss(id), duration)
    return id
  }

  return { toasts, push, dismiss }
}
