import { beforeEach, describe, expect, it } from 'bun:test'
import { ConflictError, NotFoundError, UnauthorizedError } from '@/shared/domain/errors/app-error'
import { FakePasswordHasher, FakeTokenService, InMemoryUserRepository } from '@/shared/testing/fakes'
import { AuthUsecaseImpl } from './auth.usecase'

describe('AuthUsecase', () => {
  let repository: InMemoryUserRepository
  let usecase: AuthUsecaseImpl

  beforeEach(() => {
    repository = new InMemoryUserRepository()
    usecase = new AuthUsecaseImpl(repository, new FakePasswordHasher(), new FakeTokenService())
  })

  describe('register', () => {
    it('membuat user dengan email ternormalisasi, password ter-hash, dan role user', async () => {
      const user = await usecase.register({ name: ' Budi ', email: 'Budi@Mail.COM', password: 'secret123' })

      expect(user).toMatchObject({ name: 'Budi', email: 'budi@mail.com', role: 'user' })
      expect(user).not.toHaveProperty('password')
      expect((await repository.findById(user.id))?.password).toBe('hashed:secret123')
    })

    it('menolak email yang sudah terdaftar', async () => {
      await usecase.register({ name: 'Budi', email: 'budi@mail.com', password: 'secret123' })

      await expect(usecase.register({ name: 'Lain', email: 'BUDI@mail.com', password: 'secret123' })).rejects.toBeInstanceOf(
        ConflictError,
      )
    })
  })

  describe('login', () => {
    beforeEach(async () => {
      await usecase.register({ name: 'Budi', email: 'budi@mail.com', password: 'secret123' })
    })

    it('mengembalikan token untuk kredensial yang benar', async () => {
      const result = await usecase.login({ email: 'budi@mail.com', password: 'secret123' })

      expect(result.tokenType).toBe('Bearer')
      expect(result.accessToken).toBe('token:1:user:budi@mail.com')
      expect(result.user.email).toBe('budi@mail.com')
    })

    it('menolak password salah', async () => {
      await expect(usecase.login({ email: 'budi@mail.com', password: 'wrong-pass' })).rejects.toBeInstanceOf(UnauthorizedError)
    })

    it('menolak email yang tidak terdaftar', async () => {
      await expect(usecase.login({ email: 'none@mail.com', password: 'secret123' })).rejects.toBeInstanceOf(UnauthorizedError)
    })
  })

  describe('me', () => {
    it('melempar NotFoundError bila user sudah tidak ada', async () => {
      await expect(usecase.me(99)).rejects.toBeInstanceOf(NotFoundError)
    })
  })
})
