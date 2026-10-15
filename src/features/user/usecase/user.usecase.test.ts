import { beforeEach, describe, expect, it } from 'bun:test'
import { ConflictError, NotFoundError } from '@/shared/domain/errors/app-error'
import { FakePasswordHasher, InMemoryUserRepository } from '@/shared/testing/fakes'
import { UserUsecaseImpl } from './user.usecase'

describe('UserUsecase', () => {
  let repository: InMemoryUserRepository
  let usecase: UserUsecaseImpl

  beforeEach(() => {
    repository = new InMemoryUserRepository()
    usecase = new UserUsecaseImpl(repository, new FakePasswordHasher())
  })

  const seed = (count: number) =>
    Promise.all(
      Array.from({ length: count }, (_, i) =>
        usecase.create({ name: `User ${i + 1}`, email: `user${i + 1}@mail.com`, password: 'secret123' }),
      ),
    )

  describe('list', () => {
    it('mengembalikan data terpaginasi beserta meta', async () => {
      await seed(15)

      const { items, meta } = await usecase.list({ page: 2, limit: 10 })

      expect(items).toHaveLength(5)
      expect(meta).toEqual({ page: 2, limit: 10, total: 15, totalPages: 2 })
    })

    it('memfilter berdasarkan search', async () => {
      await seed(3)
      await usecase.create({ name: 'Siti', email: 'siti@mail.com', password: 'secret123' })

      const { items, meta } = await usecase.list({ search: 'siti' })

      expect(items.map((user) => user.name)).toEqual(['Siti'])
      expect(meta.total).toBe(1)
    })
  })

  describe('create', () => {
    it('menyimpan role yang diberikan dan tidak membocorkan password', async () => {
      const user = await usecase.create({ name: 'Admin', email: 'admin@mail.com', password: 'secret123', role: 'admin' })

      expect(user.role).toBe('admin')
      expect(user).not.toHaveProperty('password')
    })

    it('menolak email duplikat', async () => {
      await seed(1)

      await expect(usecase.create({ name: 'X', email: 'user1@mail.com', password: 'secret123' })).rejects.toBeInstanceOf(
        ConflictError,
      )
    })
  })

  describe('update', () => {
    it('mengubah field dan meng-hash password baru', async () => {
      const [user] = await seed(1)

      const updated = await usecase.update(user!.id, { name: 'Baru', password: 'newsecret1' })

      expect(updated.name).toBe('Baru')
      expect(updated.email).toBe('user1@mail.com')
      expect((await repository.findById(user!.id))?.password).toBe('hashed:newsecret1')
    })

    it('mengizinkan email yang sama dengan miliknya sendiri', async () => {
      const [user] = await seed(1)

      expect((await usecase.update(user!.id, { email: 'USER1@mail.com' })).email).toBe('user1@mail.com')
    })

    it('menolak email milik user lain', async () => {
      const [first] = await seed(2)

      await expect(usecase.update(first!.id, { email: 'user2@mail.com' })).rejects.toBeInstanceOf(ConflictError)
    })

    it('melempar NotFoundError untuk id yang tidak ada', async () => {
      await expect(usecase.update(99, { name: 'X' })).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  describe('getById & delete', () => {
    it('menghapus user lalu getById melempar NotFoundError', async () => {
      const [user] = await seed(1)

      await usecase.delete(user!.id)

      await expect(usecase.getById(user!.id)).rejects.toBeInstanceOf(NotFoundError)
      await expect(usecase.delete(user!.id)).rejects.toBeInstanceOf(NotFoundError)
    })
  })
})
