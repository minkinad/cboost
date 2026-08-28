export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = new Set(['/login', '/register'])
  const { loggedIn, fetch } = useUserSession()

  if (!loggedIn.value) {
    await fetch()
  }

  if (!loggedIn.value && !publicRoutes.has(to.path)) {
    return navigateTo({ path: '/login', query: { next: to.fullPath } })
  }

  if (loggedIn.value && publicRoutes.has(to.path)) {
    return navigateTo('/')
  }
})
