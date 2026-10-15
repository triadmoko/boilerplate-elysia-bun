import type { UserRole } from '../entity/user.entity'

export interface TokenPayload {
  sub: number
  email: string
  role: UserRole
}

export interface TokenService {
  sign(payload: TokenPayload): Promise<string>
  /** Melempar UnauthorizedError bila token tidak valid atau kedaluwarsa. */
  verify(token: string): Promise<TokenPayload>
}
