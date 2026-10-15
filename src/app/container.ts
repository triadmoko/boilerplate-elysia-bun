import type { Config } from '@/core/config'
import { BcryptPasswordHasher } from '@/pkg/crypto/bcrypt.hasher'
import { JwtTokenService } from '@/pkg/jwt/jwt.service'
import type { Logger } from '@/pkg/logger'
import { authMiddleware, type AuthMiddleware } from '@/shared/delivery/http/middleware/auth.middleware'
import type { UserRepository } from '@/shared/domain/repository/user.repository'
import type { PasswordHasher } from '@/shared/domain/service/password-hasher'
import type { TokenService } from '@/shared/domain/service/token-service'
import type { Database } from '@/shared/infrastructure/database/client'
import { UserRepositoryImpl } from '@/shared/infrastructure/repository/user.repository.impl'

/** Dependency bersama yang di-inject ke setiap feature module. */
export interface Container {
  logger: Logger
  repositories: {
    user: UserRepository
  }
  services: {
    passwordHasher: PasswordHasher
    tokenService: TokenService
  }
  middlewares: {
    auth: AuthMiddleware
  }
}

export interface ContainerOverrides {
  repositories: Container['repositories']
  services: Container['services']
}

/** Rakit container dari implementasi apa pun (dipakai juga oleh test dengan fake). */
export const assembleContainer = (logger: Logger, { repositories, services }: ContainerOverrides): Container => ({
  logger,
  repositories,
  services,
  middlewares: {
    auth: authMiddleware(services.tokenService),
  },
})

export const buildContainer = (config: Config, logger: Logger, db: Database): Container =>
  assembleContainer(logger, {
    repositories: {
      user: new UserRepositoryImpl(db),
    },
    services: {
      passwordHasher: new BcryptPasswordHasher(),
      tokenService: new JwtTokenService(config.jwt.secret, config.jwt.expiresIn),
    },
  })
