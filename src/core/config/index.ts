import type { LogLevel } from '@/pkg/logger'

const LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error']

const env = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback
  if (value === undefined || value === '') throw new Error(`Missing required env: ${key}`)
  return value
}

const envNumber = (key: string, fallback?: number): number => {
  const raw = env(key, fallback?.toString())
  const value = Number(raw)
  if (!Number.isFinite(value)) throw new Error(`Env ${key} must be a number, got "${raw}"`)
  return value
}

export const loadConfig = () => {
  const logLevel = env('LOG_LEVEL', 'info') as LogLevel
  if (!LOG_LEVELS.includes(logLevel)) throw new Error(`LOG_LEVEL must be one of ${LOG_LEVELS.join(', ')}`)

  const jwtSecret = env('JWT_SECRET')
  if (jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters')

  return {
    app: {
      name: env('APP_NAME', 'popix'),
      env: env('APP_ENV', 'development'),
      host: env('APP_HOST', '0.0.0.0'),
      port: envNumber('APP_PORT', 3000),
      logLevel,
    },
    db: {
      host: env('DB_HOST', '127.0.0.1'),
      port: envNumber('DB_PORT', 3306),
      user: env('DB_USER'),
      password: env('DB_PASSWORD', ''),
      database: env('DB_NAME'),
      connectionLimit: envNumber('DB_POOL_SIZE', 10),
    },
    jwt: {
      secret: jwtSecret,
      expiresIn: env('JWT_EXPIRES_IN', '1d'),
    },
  }
}

export type Config = ReturnType<typeof loadConfig>
export type DatabaseConfig = Config['db']
