import type { User, UserRole } from '../entity/user.entity'

export interface CreateUserData {
  name: string
  email: string
  password: string
  role?: UserRole
}

export type UpdateUserData = Partial<CreateUserData>

export interface FindUsersParams {
  search?: string
  limit: number
  offset: number
}

export interface FindUsersResult {
  items: User[]
  total: number
}

export interface UserRepository {
  findById(id: number): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findMany(params: FindUsersParams): Promise<FindUsersResult>
  create(data: CreateUserData): Promise<User>
  /** Mengembalikan null bila user tidak ditemukan. */
  update(id: number, data: UpdateUserData): Promise<User | null>
  /** Mengembalikan false bila user tidak ditemukan. */
  delete(id: number): Promise<boolean>
}
