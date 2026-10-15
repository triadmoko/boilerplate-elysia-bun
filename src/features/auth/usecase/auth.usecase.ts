import { toPublicUser, type PublicUser } from '@/shared/domain/entity/user.entity'
import { ConflictError, NotFoundError, UnauthorizedError } from '@/shared/domain/errors/app-error'
import type { UserRepository } from '@/shared/domain/repository/user.repository'
import type { PasswordHasher } from '@/shared/domain/service/password-hasher'
import type { TokenService } from '@/shared/domain/service/token-service'

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResult {
  accessToken: string
  tokenType: 'Bearer'
  user: PublicUser
}

export interface AuthUsecase {
  register(input: RegisterInput): Promise<PublicUser>
  login(input: LoginInput): Promise<AuthResult>
  me(userId: number): Promise<PublicUser>
}

export class AuthUsecaseImpl implements AuthUsecase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async register({ name, email, password }: RegisterInput): Promise<PublicUser> {
    const normalizedEmail = email.trim().toLowerCase()
    if (await this.userRepository.findByEmail(normalizedEmail)) {
      throw new ConflictError('Email is already registered')
    }

    const user = await this.userRepository.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await this.passwordHasher.hash(password),
      role: 'user',
    })
    return toPublicUser(user)
  }

  async login({ email, password }: LoginInput): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(email.trim().toLowerCase())
    // Pesan disamakan agar tidak membocorkan email mana yang terdaftar.
    if (!user || !(await this.passwordHasher.verify(password, user.password))) {
      throw new UnauthorizedError('Invalid email or password')
    }

    const accessToken = await this.tokenService.sign({ sub: user.id, email: user.email, role: user.role })
    return { accessToken, tokenType: 'Bearer', user: toPublicUser(user) }
  }

  async me(userId: number): Promise<PublicUser> {
    const user = await this.userRepository.findById(userId)
    if (!user) throw new NotFoundError('User not found')
    return toPublicUser(user)
  }
}
