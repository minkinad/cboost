import { loginInputSchema } from '~~/shared/schemas/auth'
import type { AuthResponse } from '~~/shared/types/auth'
import { authService } from '../../services/auth/auth.service'
import { toHttpError } from '../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, loginInputSchema.parse)

  try {
    const user = await authService.login(input)
    await setUserSession(event, { user, loggedInAt: new Date() })
    return { user } satisfies AuthResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
