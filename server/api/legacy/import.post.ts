import type { LegacyImportResponse } from '~~/shared/contracts/habits'
import { legacyImportInputSchema } from '~~/shared/schemas/habits'
import { legacyImportService } from '../../services/legacy/legacy-import.service'
import { requireSessionUser } from '../../utils/session'
import { toHttpError } from '../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const input = await readValidatedBody(event, legacyImportInputSchema.parse)

  try {
    return (await legacyImportService.import(user.id, input)) satisfies LegacyImportResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
