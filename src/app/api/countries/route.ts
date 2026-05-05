import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET() {
  try {
    const result = await turso.execute({
      sql: `SELECT * FROM countries WHERE active = 1 ORDER BY name ASC`,
      args: [],
    })

    return NextResponse.json({ countries: result.rows })
  } catch (error: any) {
    console.error('Countries error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch countries' }, { status: 500 })
  }
}
