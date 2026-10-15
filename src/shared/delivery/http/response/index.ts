import type { PaginationMeta } from '@/pkg/pagination'

export interface SuccessResponse<T> {
  success: true
  message: string
  data: T
  meta?: PaginationMeta
}

export interface ErrorResponse {
  success: false
  message: string
  code: string
  errors?: unknown
}

export const ok = <T>(data: T, message = 'Success'): SuccessResponse<T> => ({ success: true, message, data })

export const paginated = <T>(data: T[], meta: PaginationMeta, message = 'Success'): SuccessResponse<T[]> => ({
  success: true,
  message,
  data,
  meta,
})

export const fail = (code: string, message: string, errors?: unknown): ErrorResponse => ({
  success: false,
  message,
  code,
  ...(errors === undefined ? {} : { errors }),
})
