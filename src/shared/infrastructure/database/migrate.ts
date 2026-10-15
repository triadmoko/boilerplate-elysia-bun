// Menjalankan migrasi dari folder ./migrations tanpa butuh drizzle-kit (aman dipakai di image production).
import { migrate } from 'drizzle-orm/mysql2/migrator'
import { loadConfig } from '@/core/config'
import { createLogger } from '@/pkg/logger'
import { createDatabase } from './client'

const config = loadConfig()
const logger = createLogger(config.app.logLevel)
const database = createDatabase(config.db)

try {
  await migrate(database.db, { migrationsFolder: './migrations' })
  logger.info('Migrations applied')
} catch (error) {
  logger.error('Migration failed', { error: error instanceof Error ? error.message : String(error) })
  process.exitCode = 1
} finally {
  await database.close()
}
