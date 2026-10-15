export const DEFAULT_LIMIT = 10
export const MAX_LIMIT = 100

export interface PaginationQuery {
  page?: number
  limit?: number
}

export interface Pagination {
  page: number
  limit: number
  offset: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const resolvePagination = ({ page = 1, limit = DEFAULT_LIMIT }: PaginationQuery): Pagination => {
  const safePage = Math.max(1, Math.floor(page))
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)))
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit }
}

export const buildPaginationMeta = ({ page, limit }: Pagination, total: number): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
})
