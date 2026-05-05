import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegram_id } = body

    if (!telegram_id) {
      return NextResponse.json({ error: 'telegram_id is required' }, { status: 400 })
    }

    // Check if profile exists
    const existing = await turso.execute({
      sql: `SELECT p.*, c.name as city_name, co.name as country_name, co.flag as country_flag
            FROM profiles p
            LEFT JOIN cities c ON p.city_id = c.id
            LEFT JOIN countries co ON p.country_code = co.code
            WHERE p.telegram_id = ?`,
      args: [String(telegram_id)],
    })

    if (existing.rows.length > 0) {
      const profile = existing.rows[0]
      return NextResponse.json({
        profile: {
          ...profile,
          tags: profile.tags ? String(profile.tags).split(',').filter(Boolean) : [],
          vibes: profile.vibes ? String(profile.vibes).split(',').filter(Boolean) : [],
        },
      })
    }

    // Create new profile
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await turso.execute({
      sql: `INSERT INTO profiles (id, telegram_id, created_at, updated_at, last_active)
            VALUES (?, ?, ?, ?, ?)`,
      args: [id, String(telegram_id), now, now, now],
    })

    // Fetch the new profile with joins
    const result = await turso.execute({
      sql: `SELECT p.*, c.name as city_name, co.name as country_name, co.flag as country_flag
            FROM profiles p
            LEFT JOIN cities c ON p.city_id = c.id
            LEFT JOIN countries co ON p.country_code = co.code
            WHERE p.id = ?`,
      args: [id],
    })

    return NextResponse.json({
      profile: {
        ...result.rows[0],
        tags: [],
        vibes: [],
      },
      is_new: true,
    })
  } catch (error: any) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const telegram_id = searchParams.get('telegram_id')

    if (!telegram_id) {
      return NextResponse.json({ error: 'telegram_id is required' }, { status: 400 })
    }

    const result = await turso.execute({
      sql: `SELECT p.*, c.name as city_name, co.name as country_name, co.flag as country_flag
            FROM profiles p
            LEFT JOIN cities c ON p.city_id = c.id
            LEFT JOIN countries co ON p.country_code = co.code
            WHERE p.telegram_id = ?`,
      args: [telegram_id],
    })

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const profile = result.rows[0]
    return NextResponse.json({
      profile: {
        ...profile,
        tags: profile.tags ? String(profile.tags).split(',').filter(Boolean) : [],
        vibes: profile.vibes ? String(profile.vibes).split(',').filter(Boolean) : [],
      },
    })
  } catch (error: any) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch profile' }, { status: 500 })
  }
}
