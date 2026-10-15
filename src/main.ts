import { createApp } from '@/app/app'
import { buildContainer } from '@/app/container'
import { loadConfig } from '@/core/config'
import { createLogger } from '@/pkg/logger'
import { createDatabase } from '@/shared/infrastructure/database/client'

const config = loadConfig()
const logger = createLogger(config.app.logLevel)
const database = createDatabase(config.db)
const container = buildContainer(config, logger, database.db)

const app = createApp(container, { name: config.app.name, healthCheck: database.ping }).listen({
  hostname: config.app.host,
  port: config.app.port,
})

logger.info('Server started', {
  env: config.app.env,
  url: `http://${app.server?.hostname}:${app.server?.port}`,
  docs: `http://${app.server?.hostname}:${app.server?.port}/openapi`,
})

let shuttingDown = false
const shutdown = async (signal: string) => {
  if (shuttingDown) return
  shuttingDown = true
  logger.info('Shutting down', { signal })
  try {
    await app.stop()
    await database.close()
  } finally {
    process.exit(0)
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
