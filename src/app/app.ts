import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import { createAuthModule } from '@/features/auth/module'
import { createUserModule } from '@/features/user/module'
import { errorHandler } from '@/shared/delivery/http/middleware/error.handler'
import { requestLogger } from '@/shared/delivery/http/middleware/request-logger'
import { fail, ok } from '@/shared/delivery/http/response'
import type { Feature } from '@/types/feature'
import type { Container } from './container'

export interface AppOptions {
  name?: string
  /** Dipanggil oleh GET /health; lempar error bila dependency (mis. DB) tidak sehat. */
  healthCheck?: () => Promise<void>
}

export const createApp = (container: Container, { name = 'popix', healthCheck }: AppOptions = {}) => {
  // Tambahkan feature baru di sini.
  const features: Feature[] = [createAuthModule(container), createUserModule(container)]

  const api = new Elysia({ prefix: '/api/v1' })
  for (const feature of features) {
    api.use(feature.routes)
    container.logger.debug('Feature registered', { feature: feature.name })
  }

  return new Elysia({ name: 'app' })
    .use(errorHandler(container.logger))
    .use(requestLogger(container.logger))
    .use(
      openapi({
        path: '/openapi',
        documentation: {
          info: { title: `${name} API`, version: '1.0.0' },
          components: {
            securitySchemes: {
              bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
          },
        },
      }),
    )
    .get(
      '/health',
      async ({ set }) => {
        try {
          await healthCheck?.()
          return ok({ status: 'ok' })
        } catch {
          set.status = 503
          return fail('SERVICE_UNAVAILABLE', 'Dependency check failed')
        }
      },
      { detail: { tags: ['Health'], summary: 'Health check' } },
    )
    .use(api)
}

export type App = ReturnType<typeof createApp>
