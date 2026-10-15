// Implementasi in-memory untuk unit/integration test — tidak butuh MySQL.
import { createLogger } from '@/pkg/logger'
import { assembleContainer, type Container } from '@/app/container'
import type { User, UserRole } from '@/shared/domain/entity/user.entity'
import { UnauthorizedError } from '@/shared/domain/errors/app-error'
import type {
  CreateUserData,
  FindUsersParams,
  FindUsersResult,
  UpdateUserData,
  UserRepository,
} from '@/shared/domain/repository/user.repository'
import type { PasswordHasher } from '@/shared/domain/service/password-hasher'
import type { TokenPayload, TokenService } from '@/shared/domain/service/token-service'

export class InMemoryUserRepository implements UserRepository {
  private users = new Map<number, User>()
  private nextId = 1

  async findById(id: number) {
    return this.users.get(id) ?? null
  }

  async findByEmail(email: string) {
    return [...this.users.values()].find((user) => user.email === email) ?? null
  }

  async findMany({ search, limit, offset }: FindUsersParams): Promise<FindUsersResult> {
    const keyword = search?.toLowerCase()
    const matched = [...this.users.values()]
      .filter((user) => !keyword || user.name.toLowerCase().includes(keyword) || user.email.includes(keyword))
      .sort((a, b) => b.id - a.id)
    return { items: matched.slice(offset, offset + limit), total: matched.length }
  }

  async create(data: CreateUserData) {
    const now = new Date()
    const user: User = { id: this.nextId++, role: 'user', ...data, createdAt: now, updatedAt: now }
    this.users.set(user.id, user)
    return user
  }

  async update(id: number, data: UpdateUserData) {
    const existing = this.users.get(id)
    if (!existing) return null
    const defined = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))
    const updated: User = { ...existing, ...defined, updatedAt: new Date() }
    this.users.set(id, updated)
    return updated
  }

  async delete(id: number) {
    return this.users.delete(id)
  }
}

export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string) {
    return `hashed:${plain}`
  }

  async verify(plain: string, hashed: string) {
    return hashed === `hashed:${plain}`
  }
}

export class FakeTokenService implements TokenService {
  async sign({ sub, email, role }: TokenPayload) {
    return `token:${sub}:${role}:${email}`
  }

  async verify(token: string): Promise<TokenPayload> {
    const [prefix, sub, role, ...email] = token.split(':')
    if (prefix !== 'token' || !sub || !role) throw new UnauthorizedError('Invalid or expired token')
    return { sub: Number(sub), role: role as UserRole, email: email.join(':') }
  }
}

export const createTestContainer = (): Container & { repositories: { user: InMemoryUserRepository } } => {
  const userRepository = new InMemoryUserRepository()
  const container = assembleContainer(createLogger('error'), {
    repositories: { user: userRepository },
    services: { passwordHasher: new FakePasswordHasher(), tokenService: new FakeTokenService() },
  })
  return { ...container, repositories: { user: userRepository } }
}
