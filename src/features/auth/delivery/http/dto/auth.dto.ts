import { t } from 'elysia'

export const RegisterBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  email: t.String({ format: 'email', maxLength: 191 }),
  // bcrypt hanya memproses 72 byte pertama.
  password: t.String({ minLength: 8, maxLength: 72 }),
})

export const LoginBody = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 1 }),
})
