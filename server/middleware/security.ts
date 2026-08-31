const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin'
  })
  if (process.env.NODE_ENV === 'production') setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  const method = event.method.toUpperCase()
  const url = getRequestURL(event)
  if (!url.pathname.startsWith('/api/') || !unsafeMethods.has(method)) return
  const origin = getHeader(event, 'origin')
  if (!origin) return
  const configuredOrigin = useRuntimeConfig(event).appOrigin as string | undefined
  if (origin !== (configuredOrigin || url.origin)) {
    throw createError({ statusCode: 403, statusMessage: 'Недопустимый origin' })
  }
})
