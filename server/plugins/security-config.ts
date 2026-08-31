export default defineNitroPlugin(() => {
  if (process.env.NODE_ENV !== 'production') return
  const password = useRuntimeConfig().session?.password
  if (typeof password !== 'string' || password.length < 32) {
    throw new Error('NUXT_SESSION_PASSWORD must contain at least 32 characters in production')
  }
})
