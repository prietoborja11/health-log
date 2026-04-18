const SETTINGS_KEY = 'hl_notif_settings'
const LAST_KEY = 'hl_notif_last'

export interface NotifSettings {
  enabled: boolean
  reminderHour: number
}

const DEFAULT_SETTINGS: NotifSettings = {
  enabled: false,
  reminderHour: 14,
}

const loadSettings = (): NotifSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

const saveSettings = (s: NotifSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch {}
}

export const isNotifSupported = (): boolean =>
  typeof window !== 'undefined' && 'Notification' in window

export const useNotifications = () => {
  const settings = ref<NotifSettings>(loadSettings())
  const permission = ref<NotificationPermission>(
    isNotifSupported() ? Notification.permission : 'denied',
  )

  const requestPermission = async (): Promise<boolean> => {
    if (!isNotifSupported()) return false
    const res = await Notification.requestPermission()
    permission.value = res
    return res === 'granted'
  }

  const setEnabled = async (on: boolean) => {
    if (on && permission.value !== 'granted') {
      const ok = await requestPermission()
      if (!ok) return
    }
    settings.value.enabled = on
    saveSettings(settings.value)
  }

  const setReminderHour = (hour: number) => {
    settings.value.reminderHour = Math.max(0, Math.min(23, Math.floor(hour)))
    saveSettings(settings.value)
  }

  const send = (title: string, body: string) => {
    if (!isNotifSupported() || permission.value !== 'granted') return
    try {
      new Notification(title, { body, icon: '/icon.svg', badge: '/icon.svg' })
    } catch {}
  }

  const todayKey = () => new Date().toISOString().split('T')[0]

  const maybeRemind = (hasDataToday: boolean) => {
    if (!settings.value.enabled || !isNotifSupported()) return
    if (hasDataToday) return
    const now = new Date()
    if (now.getHours() < settings.value.reminderHour) return
    const last = localStorage.getItem(LAST_KEY)
    if (last === todayKey()) return
    localStorage.setItem(LAST_KEY, todayKey())
    send(
      '¿Qué has comido hoy?',
      'Aún no has registrado nada. Un minuto basta para no perder el día.',
    )
  }

  return {
    settings,
    permission,
    requestPermission,
    setEnabled,
    setReminderHour,
    send,
    maybeRemind,
  }
}
