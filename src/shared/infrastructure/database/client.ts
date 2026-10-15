import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import type { DatabaseConfig } from '@/core/config'
import * as schema from './schema'

export type Database = MySql2Database<typeof schema>

export const createDatabase = (config: DatabaseConfig) => {
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: config.connectionLimit,
  })

  const db: Database = drizzle(pool, { schema, mode: 'default' })

  return {
    db,
    ping: async () => {
      const connection = await pool.getConnection()
      try {
        await connection.ping()
      } finally {
        connection.release()
      }
    },
    close: () => pool.end(),
  }
}
