import { t } from 'elysia'
import { MAX_LIMIT } from '@/pkg/pagination'
import { USER_ROLES } from '@/shared/domain/entity/user.entity'

export const UserIdParams = t.Object({
  id: t.Integer({ minimum: 1 }),
})

export const ListUsersQuery = t.Object({
  page: t.Optional(t.Integer({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Integer({ minimum: 1, maximum: MAX_LIMIT, default: 10 })),
  search: t.Optional(t.String({ maxLength: 100 })),
})

export const CreateUserBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  email: t.String({ format: 'email', maxLength: 191 }),
  password: t.String({ minLength: 8, maxLength: 72 }),
  role: t.Optional(t.UnionEnum(USER_ROLES)),
})

export const UpdateUserBody = t.Partial(CreateUserBody, { minProperties: 1 })
