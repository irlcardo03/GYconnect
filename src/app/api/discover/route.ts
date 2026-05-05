import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const profile_id = searchParams.get('profile_id')
    const country_code = searchParams.get('country_code')

    if (!profile_id || !country_code) {
      return NextResponse.json({ error: 'profile_id and country_code are required' }, { status: 400 })
    }

    // Get blocked user IDs
    const blocked = await turso.execute({
      sql: 'SELECT blocked_id FROM blocks WHERE blocker_id = ?',
      args: [profile_id]
    })
    const blockedIds = blocked.rows.map(r => String(r.blocked_id))

    // Get users who blocked this profile
    const blockedBy = await turso.execute({
      sql: 'SELECT blocker_id FROM blocks WHERE blocked_id = ?',
      args: [profile_id]
    })
    const blockedByIds = blockedBy.rows.map(r => String(r.blocker_id))

    const excludeIds = [profile_id, ...blockedIds, ...blockedByIds]

    // Build query with exclusion
    let sql = `SELECT * FROM profiles WHERE country_code = ? AND is_banned = 0 AND first_name != ''`
    const args: any[] = [country_code]

    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',')
      sql += ` AND id NOT IN (${placeholders})`
      args.push(...excludeIds)
    }

    sql += ` ORDER BY last_active DESC LIMIT 20`

    const result = await turso.execute({ sql, args })

    return NextResponse.json({ profiles: result.rows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
