import { Elysia } from 'elysia'
import type { AuthMiddleware } from '@/shared/delivery/http/middleware/auth.middleware'
import { ok } from '@/shared/delivery/http/response'
import type { AuthUsecase } from '../../../usecase/auth.usecase'
import { LoginBody, RegisterBody } from '../dto/auth.dto'

export const createAuthHandler = (authUsecase: AuthUsecase, auth: AuthMiddleware) =>
  new Elysia({ prefix: '/auth', detail: { tags: ['Auth'] } })
    .use(auth)
    .post(
      '/register',
      async ({ body, set }) => {
        const user = await authUsecase.register(body)
        set.status = 201
        return ok(user, 'User registered')
      },
      { body: RegisterBody, detail: { summary: 'Register a new user' } },
    )
    .post('/login', async ({ body }) => ok(await authUsecase.login(body), 'Login successful'), {
      body: LoginBody,
      detail: { summary: 'Login and obtain an access token' },
    })
    .get('/me', async ({ user }) => ok(await authUsecase.me(user.sub)), {
      auth: true,
      detail: { summary: 'Get the current user profile' },
    })
