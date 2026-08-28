const POSITIVE_MESSAGES = [
  'Даже маленький шаг сегодня важен. Держи ритм.',
  'Ты уже начал. Закрой еще одну привычку и закрепи день.',
  'Постоянство важнее рывков. Одна отметка уже двигает вперед.',
  'Твоя стабильность и есть главный результат. Продолжай.',
  'Лучше сделать, чем идеально планировать. Закрой следующую привычку.'
]

const REMINDER_COOLDOWN_MS = 2 * 60 * 60 * 1000
const REMINDER_INTERVAL_MS = 45 * 60 * 1000

let intervalId: ReturnType<typeof setInterval> | null = null

export function useMotivationReminder() {
  const permission = useState<NotificationPermission>('motivation-permission', () => 'default')
  const lastReminderAt = useState<number>('motivation-last-reminder-at', () => 0)

  const notificationsSupported = computed(() => import.meta.client && 'Notification' in window)

  function refreshPermission() {
    if (!notificationsSupported.value) {
      permission.value = 'denied'
      return
    }

    permission.value = Notification.permission
  }

  async function requestPermission() {
    if (!notificationsSupported.value) {
      return
    }

    permission.value = await Notification.requestPermission()
  }

  function pickMessage(seed: number): string {
    const index = Math.abs(seed) % POSITIVE_MESSAGES.length
    return POSITIVE_MESSAGES[index] ?? POSITIVE_MESSAGES[0] ?? ''
  }

  function maybeSendReminder(pendingCount: number) {
    if (!notificationsSupported.value || permission.value !== 'granted' || pendingCount <= 0) {
      return
    }

    const now = Date.now()

    // Ограничиваем частоту уведомлений, чтобы не раздражать пользователя.
    if (now - lastReminderAt.value < REMINDER_COOLDOWN_MS) {
      return
    }

    const message = pickMessage(now + pendingCount)
    new Notification('Напоминание DailyBoost', {
      body: `${message} Осталось привычек: ${pendingCount}.`
    })
    lastReminderAt.value = now
  }

  function start(getPendingCount: () => number) {
    if (!import.meta.client) {
      return
    }

    refreshPermission()

    if (intervalId) {
      clearInterval(intervalId)
    }

    intervalId = setInterval(() => {
      maybeSendReminder(getPendingCount())
    }, REMINDER_INTERVAL_MS)
  }

  function stop() {
    if (!intervalId) {
      return
    }

    clearInterval(intervalId)
    intervalId = null
  }

  return {
    permission,
    notificationsSupported,
    refreshPermission,
    requestPermission,
    maybeSendReminder,
    start,
    stop,
    pickMessage
  }
}
