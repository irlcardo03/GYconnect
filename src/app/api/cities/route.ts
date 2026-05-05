import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

const ADMIN_TELEGRAM_ID = '8262090447'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country_code = searchParams.get('country_code')

    if (!country_code) {
      return NextResponse.json({ error: 'country_code is required' }, { status: 400 })
    }

    const result = await turso.execute({
      sql: `SELECT * FROM cities WHERE country_code = ? AND active = 1 ORDER BY name ASC`,
      args: [country_code],
    })

    return NextResponse.json({ cities: result.rows })
  } catch (error: any) {
    console.error('Cities error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch cities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { country_code, name, admin_id } = body

    if (!country_code || !name) {
      return NextResponse.json({ error: 'country_code and name are required' }, { status: 400 })
    }

    // Admin check
    if (admin_id !== ADMIN_TELEGRAM_ID) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    await turso.execute({
      sql: `INSERT INTO cities (id, country_code, name, active, created_at) VALUES (?, ?, ?, 1, ?)`,
      args: [id, country_code, name, now],
    })

    // Log admin action
    const logId = crypto.randomUUID()
    await turso.execute({
      sql: `INSERT INTO admin_logs (id, admin_id, action, details, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [logId, admin_id, 'add-city', `Added city: ${name} to country: ${country_code}`, now],
    })

    const result = await turso.execute({
      sql: 'SELECT * FROM cities WHERE id = ?',
      args: [id],
    })

    return NextResponse.json({ city: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Add city error:', error)
    return NextResponse.json({ error: error.message || 'Failed to add city' }, { status: 500 })
  }
}
