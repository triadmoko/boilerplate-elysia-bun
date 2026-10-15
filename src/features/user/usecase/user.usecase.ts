import { buildPaginationMeta, resolvePagination, type PaginationMeta, type PaginationQuery } from '@/pkg/pagination'
import { toPublicUser, type PublicUser, type UserRole } from '@/shared/domain/entity/user.entity'
import { ConflictError, NotFoundError } from '@/shared/domain/errors/app-error'
import type { UpdateUserData, UserRepository } from '@/shared/domain/repository/user.repository'
import type { PasswordHasher } from '@/shared/domain/service/password-hasher'

export interface ListUsersInput extends PaginationQuery {
  search?: string
}

export interface ListUsersResult {
  items: PublicUser[]
  meta: PaginationMeta
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role?: UserRole
}

export type UpdateUserInput = Partial<CreateUserInput>

export interface UserUsecase {
  list(input: ListUsersInput): Promise<ListUsersResult>
  getById(id: number): Promise<PublicUser>
  create(input: CreateUserInput): Promise<PublicUser>
  update(id: number, input: UpdateUserInput): Promise<PublicUser>
  delete(id: number): Promise<void>
}

export class UserUsecaseImpl implements UserUsecase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async list({ search, ...query }: ListUsersInput): Promise<ListUsersResult> {
    const pagination = resolvePagination(query)
    const { items, total } = await this.userRepository.findMany({
      search: search?.trim() || undefined,
      limit: pagination.limit,
      offset: pagination.offset,
    })
    return { items: items.map(toPublicUser), meta: buildPaginationMeta(pagination, total) }
  }

  async getById(id: number): Promise<PublicUser> {
    const user = await this.userRepository.findById(id)
    if (!user) throw new NotFoundError('User not found')
    return toPublicUser(user)
  }

  async create({ name, email, password, role }: CreateUserInput): Promise<PublicUser> {
    const normalizedEmail = email.trim().toLowerCase()
    await this.ensureEmailAvailable(normalizedEmail)

    const user = await this.userRepository.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await this.passwordHasher.hash(password),
      role: role ?? 'user',
    })
    return toPublicUser(user)
  }

  async update(id: number, { name, email, password, role }: UpdateUserInput): Promise<PublicUser> {
    const existing = await this.userRepository.findById(id)
    if (!existing) throw new NotFoundError('User not found')

    const data: UpdateUserData = { role }
    if (name !== undefined) data.name = name.trim()
    if (email !== undefined) {
      data.email = email.trim().toLowerCase()
      if (data.email !== existing.email) await this.ensureEmailAvailable(data.email)
    }
    if (password !== undefined) data.password = await this.passwordHasher.hash(password)

    const updated = await this.userRepository.update(id, data)
    if (!updated) throw new NotFoundError('User not found')
    return toPublicUser(updated)
  }

  async delete(id: number): Promise<void> {
    const deleted = await this.userRepository.delete(id)
    if (!deleted) throw new NotFoundError('User not found')
  }

  private async ensureEmailAvailable(email: string) {
    if (await this.userRepository.findByEmail(email)) {
      throw new ConflictError('Email is already registered')
    }
  }
}
