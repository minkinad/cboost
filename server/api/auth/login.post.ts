import { loginInputSchema } from '~~/shared/schemas/auth'
import type { AuthResponse } from '~~/shared/types/auth'
import { authService } from '../../services/auth/auth.service'
import { toHttpError } from '../../utils/http-errors'
import { assertRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  assertRateLimit(event, 'auth:login', 10, 15 * 60 * 1000)
  const input = await readValidatedBody(event, loginInputSchema.parse)

  try {
    const user = await authService.login(input)
    await setUserSession(event, { user, loggedInAt: new Date() })
    return { user } satisfies AuthResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
