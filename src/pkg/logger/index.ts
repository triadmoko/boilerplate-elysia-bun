import type { LogMeta, Logger } from '@/shared/domain/service/logger'

export type { Logger }

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const PRIORITY: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }

export const createLogger = (minLevel: LogLevel = 'info'): Logger => {
  const log = (level: LogLevel, message: string, meta?: LogMeta) => {
    if (PRIORITY[level] < PRIORITY[minLevel]) return
    const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...meta })
    if (level === 'error' || level === 'warn') console.error(line)
    else console.log(line)
  }

  return {
    debug: (message: string, meta?: LogMeta) => log('debug', message, meta),
    info: (message: string, meta?: LogMeta) => log('info', message, meta),
    warn: (message: string, meta?: LogMeta) => log('warn', message, meta),
    error: (message: string, meta?: LogMeta) => log('error', message, meta),
  }
}
