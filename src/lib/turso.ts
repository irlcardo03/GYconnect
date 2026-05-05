import { createClient, type Client } from '@libsql/client'

const globalForTurso = globalThis as unknown as {
  turso: Client | undefined
}

function createDbClient(): Client {
  const tursoUrl = process.env.TURSO_URL
  const tursoToken = process.env.TURSO_TOKEN
  
  if (tursoUrl && tursoUrl.startsWith('libsql://') && tursoToken) {
    console.log('[DB] Connecting to Turso:', tursoUrl)
    return createClient({ url: tursoUrl, authToken: tursoToken })
  }
  
  console.log('[DB] Using local SQLite')
  return createClient({ url: 'file:gyconnect.db' })
}

export const turso = globalForTurso.turso ?? createDbClient()

if (process.env.NODE_ENV !== 'production') globalForTurso.turso = turso

export default turso
