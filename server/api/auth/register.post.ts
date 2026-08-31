import type { AuthResponse } from '~~/shared/types/auth'
import { registerInputSchema } from '~~/shared/schemas/auth'
import { authService } from '../../services/auth/auth.service'
import { toHttpError } from '../../utils/http-errors'
import { assertRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  assertRateLimit(event, 'auth:register', 5, 60 * 60 * 1000)
  const input = await readValidatedBody(event, registerInputSchema.parse)

  try {
    const user = await authService.register(input)
    await setUserSession(event, { user, loggedInAt: new Date() })
    setResponseStatus(event, 201)
    return { user } satisfies AuthResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
