import { SignJWT, jwtVerify } from 'jose'
import { USER_ROLES, type UserRole } from '@/shared/domain/entity/user.entity'
import { UnauthorizedError } from '@/shared/domain/errors/app-error'
import type { TokenPayload, TokenService } from '@/shared/domain/service/token-service'

const ALGORITHM = 'HS256'

export class JwtTokenService implements TokenService {
  private readonly key: Uint8Array

  constructor(
    secret: string,
    private readonly expiresIn: string,
  ) {
    this.key = new TextEncoder().encode(secret)
  }

  sign({ sub, email, role }: TokenPayload): Promise<string> {
    return new SignJWT({ email, role })
      .setProtectedHeader({ alg: ALGORITHM })
      .setSubject(String(sub))
      .setIssuedAt()
      .setExpirationTime(this.expiresIn)
      .sign(this.key)
  }

  async verify(token: string): Promise<TokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.key, { algorithms: [ALGORITHM] })
      const sub = Number(payload.sub)
      const { email, role } = payload
      if (!Number.isInteger(sub) || typeof email !== 'string' || !USER_ROLES.includes(role as UserRole)) {
        throw new Error('Malformed payload')
      }
      return { sub, email, role: role as UserRole }
    } catch {
      throw new UnauthorizedError('Invalid or expired token')
    }
  }
}
