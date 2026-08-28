import type { LegacyImportInput } from '~~/shared/schemas/habits'
import { mapLegacyHabits } from '../../domain/habits/legacy-mapping'
import { ApplicationError } from '../../domain/errors'
import type { LegacyImportRepository, LegacyImportResult } from '../../repositories/legacy-import.repository'
import { legacyImportRepository } from '../../repositories/prisma/prisma-legacy-import.repository'
import { userRepository } from '../../repositories/prisma/prisma-user.repository'
import type { UserRepository } from '../../repositories/user.repository'

export class LegacyImportService {
  constructor(
    private readonly users: UserRepository,
    private readonly imports: LegacyImportRepository
  ) {}

  async import(userId: string, input: LegacyImportInput): Promise<LegacyImportResult> {
    const user = await this.users.findById(userId)

    if (!user) {
      throw new ApplicationError('Пользователь не найден', 404)
    }

    return this.imports.import(userId, mapLegacyHabits(input, user.timezone))
  }
}

export const legacyImportService = new LegacyImportService(userRepository, legacyImportRepository)
