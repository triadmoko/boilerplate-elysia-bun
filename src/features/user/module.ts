import type { Container } from '@/app/container'
import type { Feature } from '@/types/feature'
import { createUserHandler } from './delivery/http/handler/user.handler'
import { UserUsecaseImpl } from './usecase/user.usecase'

export const createUserModule = ({ logger, repositories, services, middlewares }: Container): Feature => {
  const usecase = new UserUsecaseImpl(repositories.user, services.passwordHasher, logger)

  return {
    name: 'user',
    routes: createUserHandler(usecase, middlewares.auth),
  }
}
