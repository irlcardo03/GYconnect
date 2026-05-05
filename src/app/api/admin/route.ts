import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      const totalUsers = await turso.execute({
        sql: 'SELECT COUNT(*) as count FROM profiles',
        args: []
      })
      const newToday = await turso.execute({
        sql: "SELECT COUNT(*) as count FROM profiles WHERE date(created_at) = date('now')",
        args: []
      })
      const active = await turso.execute({
        sql: "SELECT COUNT(*) as count FROM profiles WHERE last_active > datetime('now', '-7 days')",
        args: []
      })
      const reportsCount = await turso.execute({
        sql: "SELECT COUNT(*) as count FROM reports WHERE status = 'pending'",
        args: []
      })

      return NextResponse.json({
        stats: {
          total_users: Number(totalUsers.rows[0].count),
          new_today: Number(newToday.rows[0].count),
          active: Number(active.rows[0].count),
          reports_count: Number(reportsCount.rows[0].count)
        }
      })
    }

    if (action === 'users') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = (page - 1) * limit

      const users = await turso.execute({
        sql: 'SELECT * FROM profiles ORDER BY created_at DESC LIMIT ? OFFSET ?',
        args: [limit, offset]
      })

      const total = await turso.execute({
        sql: 'SELECT COUNT(*) as count FROM profiles',
        args: []
      })

      return NextResponse.json({
        users: users.rows,
        page,
        limit,
        total: Number(total.rows[0].count)
      })
    }

    if (action === 'reports') {
      const reports = await turso.execute({
        sql: 'SELECT * FROM reports ORDER BY created_at DESC',
        args: []
      })
      return NextResponse.json({ reports: reports.rows })
    }

    if (action === 'payments') {
      const payments = await turso.execute({
        sql: 'SELECT * FROM payments ORDER BY created_at DESC',
        args: []
      })
      return NextResponse.json({ payments: payments.rows })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    if (action === 'ban_user') {
      const { profile_id } = params
      if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

      await turso.execute({
        sql: 'UPDATE profiles SET is_banned = 1, updated_at = datetime(\'now\') WHERE id = ?',
        args: [profile_id]
      })
      return NextResponse.json({ status: 'banned' })
    }

    if (action === 'unban_user') {
      const { profile_id } = params
      if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

      await turso.execute({
        sql: 'UPDATE profiles SET is_banned = 0, updated_at = datetime(\'now\') WHERE id = ?',
        args: [profile_id]
      })
      return NextResponse.json({ status: 'unbanned' })
    }

    if (action === 'add_country') {
      const { id, name, code, flag } = params
      if (!id || !name || !code) return NextResponse.json({ error: 'id, name, code required' }, { status: 400 })

      await turso.execute({
        sql: 'INSERT INTO countries (id, name, code, flag) VALUES (?, ?, ?, ?)',
        args: [id, name, code, flag || '']
      })
      return NextResponse.json({ status: 'added' })
    }

    if (action === 'add_cities') {
      const { country_code, names } = params
      if (!country_code || !names || !Array.isArray(names)) {
        return NextResponse.json({ error: 'country_code and names array required' }, { status: 400 })
      }

      const timestamp = Date.now()
      const added: string[] = []

      for (let i = 0; i < names.length; i++) {
        const cityId = `${country_code.toLowerCase()}-${timestamp}-${i}`
        try {
          await turso.execute({
            sql: 'INSERT INTO cities (id, country_code, name) VALUES (?, ?, ?)',
            args: [cityId, country_code, names[i]]
          })
          added.push(cityId)
        } catch (e: any) {
          if (!e.message?.includes('UNIQUE constraint')) {
            console.error('City insert error:', e.message)
          }
        }
      }
      return NextResponse.json({ added, count: added.length })
    }

    if (action === 'delete_group') {
      const { group_id } = params
      if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

      // Delete group members and messages first
      await turso.execute({
        sql: 'DELETE FROM group_members WHERE group_id = ?',
        args: [group_id]
      })
      await turso.execute({
        sql: 'DELETE FROM group_messages WHERE group_id = ?',
        args: [group_id]
      })
      await turso.execute({
        sql: 'DELETE FROM groups WHERE id = ?',
        args: [group_id]
      })
      return NextResponse.json({ status: 'deleted' })
    }

    if (action === 'resolve_report') {
      const { report_id, resolution } = params
      if (!report_id) return NextResponse.json({ error: 'report_id required' }, { status: 400 })

      await turso.execute({
        sql: 'UPDATE reports SET status = ? WHERE id = ?',
        args: [resolution || 'resolved', report_id]
      })
      return NextResponse.json({ status: 'resolved' })
    }

    if (action === 'add_promo') {
      const { code, tier, duration_days, max_uses } = params
      if (!code || !tier) return NextResponse.json({ error: 'code and tier required' }, { status: 400 })

      const id = crypto.randomUUID()
      await turso.execute({
        sql: 'INSERT INTO promo_codes (id, code, tier, duration_days, max_uses) VALUES (?, ?, ?, ?, ?)',
        args: [id, code, tier, duration_days || 30, max_uses || 0]
      })
      return NextResponse.json({ status: 'added', promo_id: id })
    }

    if (action === 'toggle_freemium') {
      const current = await turso.execute({
        sql: "SELECT value FROM app_settings WHERE key = 'freemium_mode'",
        args: []
      })
      const newVal = current.rows.length > 0 && String(current.rows[0].value) === 'true' ? 'false' : 'true'
      await turso.execute({
        sql: "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('freemium_mode', ?, datetime('now'))",
        args: [newVal]
      })
      return NextResponse.json({ freemium_mode: newVal })
    }

    if (action === 'grant_premium') {
      const { profile_id, tier, days } = params
      if (!profile_id || !tier || !days) {
        return NextResponse.json({ error: 'profile_id, tier, and days required' }, { status: 400 })
      }

      await turso.execute({
        sql: `UPDATE profiles SET subscription_tier = ?, subscription_expires_at = datetime('now', '+' || ? || ' days'), updated_at = datetime('now') WHERE id = ?`,
        args: [tier, days, profile_id]
      })
      return NextResponse.json({ status: 'granted' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
