import type { Container } from '@/app/container'
import type { Feature } from '@/types/feature'
import { createAuthHandler } from './delivery/http/handler/auth.handler'
import { AuthUsecaseImpl } from './usecase/auth.usecase'

export const createAuthModule = ({ logger, repositories, services, middlewares }: Container): Feature => {
  const usecase = new AuthUsecaseImpl(repositories.user, services.passwordHasher, services.tokenService, logger)

  return {
    name: 'auth',
    routes: createAuthHandler(usecase, middlewares.auth),
  }
}
