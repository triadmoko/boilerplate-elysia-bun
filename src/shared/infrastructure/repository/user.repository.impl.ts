import { count, desc, eq, like, or } from 'drizzle-orm'
import type { User } from '@/shared/domain/entity/user.entity'
import type {
  CreateUserData,
  FindUsersParams,
  FindUsersResult,
  UpdateUserData,
  UserRepository,
} from '@/shared/domain/repository/user.repository'
import type { Database } from '../database/client'
import { users, type UserRow } from '../database/schema'

const toEntity = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  password: row.password,
  role: row.role,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`)

export class UserRepositoryImpl implements UserRepository {
  constructor(private readonly db: Database) {}

  async findById(id: number): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1)
    return row ? toEntity(row) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email)).limit(1)
    return row ? toEntity(row) : null
  }

  async findMany({ search, limit, offset }: FindUsersParams): Promise<FindUsersResult> {
    const pattern = search ? `%${escapeLike(search)}%` : undefined
    const where = pattern ? or(like(users.name, pattern), like(users.email, pattern)) : undefined

    const [rows, [totalRow]] = await Promise.all([
      this.db.select().from(users).where(where).orderBy(desc(users.id)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(users).where(where),
    ])

    return { items: rows.map(toEntity), total: totalRow?.total ?? 0 }
  }

  async create(data: CreateUserData): Promise<User> {
    const [inserted] = await this.db.insert(users).values(data).$returningId()
    const user = inserted && (await this.findById(inserted.id))
    if (!user) throw new Error('Failed to load user after insert')
    return user
  }

  async update(id: number, data: UpdateUserData): Promise<User | null> {
    const values = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))
    if (Object.keys(values).length > 0) {
      await this.db.update(users).set(values).where(eq(users.id, id))
    }
    return this.findById(id)
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await this.db.delete(users).where(eq(users.id, id))
    return result.affectedRows > 0
  }
}
