import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET() {
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM countries WHERE active = 1 ORDER BY name',
      args: []
    })

    return NextResponse.json({ countries: result.rows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
