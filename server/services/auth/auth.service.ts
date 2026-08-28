import type { LoginInput, RegisterInput } from '~~/shared/schemas/auth'
import type { SessionUser } from '~~/shared/types/auth'
import { ApplicationError } from '../../domain/errors'
import { toSessionUser } from '../../repositories/prisma/mappers'
import { userRepository } from '../../repositories/prisma/prisma-user.repository'
import type { UserRepository } from '../../repositories/user.repository'

export interface PasswordService {
  hash(password: string): Promise<string>
  verify(hash: string, password: string): Promise<boolean>
  needsRehash(hash: string): boolean
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordService
  ) {}

  async register(input: RegisterInput): Promise<SessionUser> {
    if (await this.users.findByEmail(input.email)) {
      throw new ApplicationError('Пользователь с таким email уже существует', 409)
    }

    const passwordHash = await this.passwords.hash(input.password)
    const user = await this.users.create({
      email: input.email,
      passwordHash,
      displayName: input.displayName ?? null,
      timezone: input.timezone
    })
    return toSessionUser(user)
  }

  async login(input: LoginInput): Promise<SessionUser> {
    const user = await this.users.findByEmail(input.email)

    if (!user) {
      await this.passwords.hash(input.password)
      throw new ApplicationError('Неверный email или пароль', 401)
    }

    if (!(await this.passwords.verify(user.passwordHash, input.password))) {
      throw new ApplicationError('Неверный email или пароль', 401)
    }

    if (this.passwords.needsRehash(user.passwordHash)) {
      await this.users.updatePasswordHash(user.id, await this.passwords.hash(input.password))
    }

    return toSessionUser(user)
  }
}

export const authService = new AuthService(userRepository, {
  hash: (password) => hashPassword(password),
  verify: (hash, password) => verifyPassword(hash, password),
  needsRehash: (hash) => passwordNeedsReHash(hash)
})
