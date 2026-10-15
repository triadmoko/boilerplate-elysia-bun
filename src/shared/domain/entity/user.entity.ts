export const USER_ROLES = ['admin', 'user'] as const

export type UserRole = (typeof USER_ROLES)[number]

export interface User {
  id: number
  name: string
  email: string
  password: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

/** User tanpa field sensitif, aman dikirim ke client. */
export type PublicUser = Omit<User, 'password'>

export const toPublicUser = ({ password: _password, ...user }: User): PublicUser => user
