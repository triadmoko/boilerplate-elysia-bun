import { Elysia } from 'elysia'
import type { UserRole } from '@/shared/domain/entity/user.entity'
import { ForbiddenError, UnauthorizedError } from '@/shared/domain/errors/app-error'
import type { TokenService } from '@/shared/domain/service/token-service'

const BEARER_PREFIX = 'Bearer '

/**
 * Macro autentikasi:
 * - `auth: true`                 → wajib Bearer token valid, menyuntikkan `user` (TokenPayload) ke context.
 * - `roles: ['admin']`           → seperti `auth`, ditambah cek role.
 */
export const authMiddleware = (tokenService: TokenService) => {
  const authenticate = async (authorization: string | undefined) => {
    if (!authorization?.startsWith(BEARER_PREFIX)) throw new UnauthorizedError('Missing bearer token')
    return tokenService.verify(authorization.slice(BEARER_PREFIX.length).trim())
  }

  return new Elysia({ name: 'middleware.auth' }).macro({
    auth: {
      detail: { security: [{ bearerAuth: [] }] },
      async resolve({ headers }) {
        return { user: await authenticate(headers.authorization) }
      },
    },
    roles: (allowed: UserRole[]) => ({
      detail: { security: [{ bearerAuth: [] }] },
      async resolve({ headers }) {
        const user = await authenticate(headers.authorization)
        if (!allowed.includes(user.role)) throw new ForbiddenError('Insufficient role')
        return { user }
      },
    }),
  })
}

export type AuthMiddleware = ReturnType<typeof authMiddleware>
