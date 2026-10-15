import { Elysia } from 'elysia'
import type { AuthMiddleware } from '@/shared/delivery/http/middleware/auth.middleware'
import { ok, paginated } from '@/shared/delivery/http/response'
import type { UserUsecase } from '../../../usecase/user.usecase'
import { CreateUserBody, ListUsersQuery, UpdateUserBody, UserIdParams } from '../dto/user.dto'

export const createUserHandler = (userUsecase: UserUsecase, auth: AuthMiddleware) =>
  new Elysia({ prefix: '/users', detail: { tags: ['User'] } })
    .use(auth)
    .get(
      '/',
      async ({ query }) => {
        const { items, meta } = await userUsecase.list(query)
        return paginated(items, meta)
      },
      { auth: true, query: ListUsersQuery, detail: { summary: 'List users (paginated)' } },
    )
    .get('/:id', async ({ params }) => ok(await userUsecase.getById(params.id)), {
      auth: true,
      params: UserIdParams,
      detail: { summary: 'Get user by id' },
    })
    .post(
      '/',
      async ({ body, set }) => {
        const user = await userUsecase.create(body)
        set.status = 201
        return ok(user, 'User created')
      },
      { auth: true, body: CreateUserBody, detail: { summary: 'Create user' } },
    )
    .put('/:id', async ({ params, body }) => ok(await userUsecase.update(params.id, body), 'User updated'), {
      auth: true,
      params: UserIdParams,
      body: UpdateUserBody,
      detail: { summary: 'Update user' },
    })
    .delete(
      '/:id',
      async ({ params }) => {
        await userUsecase.delete(params.id)
        return ok(null, 'User deleted')
      },
      { auth: true, params: UserIdParams, detail: { summary: 'Delete user' } },
    )
