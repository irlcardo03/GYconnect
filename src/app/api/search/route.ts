import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const country_code = searchParams.get('country_code')

    if (!q) {
      return NextResponse.json({ error: 'q is required' }, { status: 400 })
    }

    // Check if query matches admin telegram ID
    const adminTelegramId = process.env.ADMIN_TELEGRAM_ID
    if (adminTelegramId && q === adminTelegramId) {
      return NextResponse.json({ isAdmin: true })
    }

    let sql = `SELECT id, telegram_id, username, first_name, mood, country_code, city_id, subscription_tier
               FROM profiles WHERE is_banned = 0`
    const args: any[] = []

    if (country_code) {
      sql += ' AND country_code = ?'
      args.push(country_code)
    }

    sql += ' AND (username LIKE ? OR first_name LIKE ?) ORDER BY last_active DESC LIMIT 20'
    const searchTerm = `%${q}%`
    args.push(searchTerm, searchTerm)

    const result = await turso.execute({ sql, args })

    return NextResponse.json({ profiles: result.rows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
