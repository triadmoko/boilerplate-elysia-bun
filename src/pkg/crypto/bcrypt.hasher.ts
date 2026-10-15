import type { PasswordHasher } from '@/shared/domain/service/password-hasher'

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly cost = 10) {}

  hash(plain: string): Promise<string> {
    return Bun.password.hash(plain, { algorithm: 'bcrypt', cost: this.cost })
  }

  verify(plain: string, hashed: string): Promise<boolean> {
    return Bun.password.verify(plain, hashed)
  }
}
