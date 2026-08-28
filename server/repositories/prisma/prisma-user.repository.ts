import { usePrisma } from '../../utils/prisma'
import type { UserRepository, UserRecord } from '../user.repository'
import { mapUser } from './mappers'

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await usePrisma().user.findUnique({ where: { email } })
    return user ? mapUser(user) : null
  }

  async findById(userId: string): Promise<UserRecord | null> {
    const user = await usePrisma().user.findUnique({ where: { id: userId } })
    return user ? mapUser(user) : null
  }

  async create(input: {
    email: string
    passwordHash: string
    displayName: string | null
    timezone: string
  }): Promise<UserRecord> {
    const user = await usePrisma().user.create({ data: input })
    return mapUser(user)
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await usePrisma().user.update({
      where: { id: userId },
      data: { passwordHash }
    })
  }
}

export const userRepository: UserRepository = new PrismaUserRepository()
