import { Elysia } from 'elysia'
import type { Logger } from '@/pkg/logger'
import { AppError } from '@/shared/domain/errors/app-error'
import { fail } from '../response'

export const errorHandler = (logger: Logger) =>
  new Elysia({ name: 'middleware.error-handler' }).onError({ as: 'global' }, ({ code, error, set, request }) => {
    if (error instanceof AppError) {
      set.status = error.status
      return fail(error.code, error.message)
    }

    switch (code) {
      case 'VALIDATION':
        set.status = 422
        return fail(
          'VALIDATION_ERROR',
          'Validation failed',
          error.all.map((issue) => ({
            path: 'path' in issue ? issue.path : undefined,
            message: issue.summary ?? issue.message,
          })),
        )
      case 'PARSE':
        set.status = 400
        return fail('BAD_REQUEST', 'Malformed request body')
      case 'NOT_FOUND':
        set.status = 404
        return fail('NOT_FOUND', 'Route not found')
    }

    logger.error('Unhandled error', {
      method: request.method,
      url: request.url,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    set.status = 500
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error')
  })
