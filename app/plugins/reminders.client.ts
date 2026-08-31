import type { RemindersResponse } from '~~/shared/contracts/reminders'

function timeInZone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date)
}

function dateInZone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export default defineNuxtPlugin((nuxtApp) => {
  let timer: ReturnType<typeof setInterval> | undefined

  async function showReminder(title: string) {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration) {
      await registration.showNotification(title, { body: 'Пора отметить привычку в DailyBoost.', icon: '/pwa-192x192.png', badge: '/pwa-64x64.png', tag: `dailyboost-${title}` })
      return
    }
    new Notification(title, { body: 'Пора отметить привычку в DailyBoost.', icon: '/pwa-192x192.png', tag: `dailyboost-${title}` })
  }

  async function checkReminders() {
    if (!navigator.onLine || !('Notification' in window) || Notification.permission !== 'granted') return
    try {
      const { reminders } = await $fetch<RemindersResponse>('/api/reminders')
      const now = new Date()
      for (const reminder of reminders) {
        if (!reminder.enabled || timeInZone(now, reminder.timezone) !== reminder.time) continue
        const shownKey = `dailyboost-reminder:${reminder.id}:${dateInZone(now, reminder.timezone)}`
        if (sessionStorage.getItem(shownKey)) continue
        sessionStorage.setItem(shownKey, 'shown')
        await showReminder(reminder.habitTitle)
      }
    } catch {
      // Session may be absent or the network may have changed between checks.
    }
  }

  nuxtApp.hook('app:mounted', () => {
    void checkReminders()
    timer = setInterval(() => void checkReminders(), 30_000)
  })
  nuxtApp.hook('app:error', () => {
    if (timer) clearInterval(timer)
  })
})
