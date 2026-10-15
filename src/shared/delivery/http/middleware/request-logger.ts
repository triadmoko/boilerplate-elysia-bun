import { Elysia } from 'elysia'
import type { Logger } from '@/pkg/logger'

export const requestLogger = (logger: Logger) =>
  new Elysia({ name: 'middleware.request-logger' })
    .derive({ as: 'global' }, () => ({ requestStartedAt: performance.now() }))
    .onAfterResponse({ as: 'global' }, ({ request, path, set, requestStartedAt }) => {
      logger.info('HTTP request', {
        method: request.method,
        path,
        status: set.status,
        durationMs: requestStartedAt === undefined ? undefined : Number((performance.now() - requestStartedAt).toFixed(2)),
      })
    })
