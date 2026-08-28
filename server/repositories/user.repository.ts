import type { SessionUser } from '~~/shared/types/auth'

export interface UserRecord extends SessionUser {
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>
  findById(userId: string): Promise<UserRecord | null>
  create(input: {
    email: string
    passwordHash: string
    displayName: string | null
    timezone: string
  }): Promise<UserRecord>
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>
}
