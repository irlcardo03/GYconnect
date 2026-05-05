import { NextResponse } from 'next/server'
import turso from '@/lib/turso'
import { initializeDatabase } from '@/lib/db-init'

// Run migrations to add missing columns
async function runMigrations() {
  const migrations = [
    { sql: "ALTER TABLE profiles ADD COLUMN username TEXT NOT NULL DEFAULT ''", name: 'add_username' },
  ]

  for (const migration of migrations) {
    try {
      await turso.execute(migration.sql)
      console.log(`[DB] Migration ${migration.name} applied`)
    } catch (e: any) {
      if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
        console.log(`[DB] Migration ${migration.name} already applied`)
      } else {
        console.error(`[DB] Migration ${migration.name} error:`, e.message)
      }
    }
  }
}

export async function GET() {
  try {
    await initializeDatabase()
    await runMigrations()
    return NextResponse.json({ status: 'ok', migrated: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST() {
  try {
    await initializeDatabase()
    await runMigrations()
    return NextResponse.json({ status: 'ok', migrated: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
