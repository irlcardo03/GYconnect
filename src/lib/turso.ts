import { createClient, type Client } from '@libsql/client'

const globalForTurso = globalThis as unknown as {
  turso: Client | undefined
}

// Try Turso first, fall back to local SQLite
function createDbClient(): Client {
  const tursoUrl = process.env.TURSO_URL
  const tursoToken = process.env.TURSO_TOKEN
  
  if (tursoUrl && tursoUrl.startsWith('libsql://') && tursoToken) {
    try {
      console.log('[DB] Attempting Turso connection:', tursoUrl)
      return createClient({ url: tursoUrl, authToken: tursoToken })
    } catch (err) {
      console.error('[DB] Turso connection failed, falling back to local SQLite:', err)
    }
  }
  
  // Fallback to local SQLite
  console.log('[DB] Using local SQLite database')
  return createClient({ url: 'file:gyconnect.db' })
}

export const turso = globalForTurso.turso ?? createDbClient()

if (process.env.NODE_ENV !== 'production') globalForTurso.turso = turso

export default turso
