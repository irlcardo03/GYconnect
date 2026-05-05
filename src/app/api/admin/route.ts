import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

const ADMIN_TELEGRAM_ID = '8262090447'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const admin_id = searchParams.get('admin_id')

    if (!admin_id || admin_id !== ADMIN_TELEGRAM_ID) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    // Total users
    const totalUsers = await turso.execute({
      sql: 'SELECT COUNT(*) as count FROM profiles',
      args: [],
    })

    // Active today
    const activeToday = await turso.execute({
      sql: "SELECT COUNT(*) as count FROM profiles WHERE DATE(last_active) = ?",
      args: [todayStr],
    })

    // New today
    const newToday = await turso.execute({
      sql: "SELECT COUNT(*) as count FROM profiles WHERE DATE(created_at) = ?",
      args: [todayStr],
    })

    // Premium counts by tier
    const premiumCounts = await turso.execute({
      sql: `SELECT subscription_tier, COUNT(*) as count FROM profiles
            WHERE subscription_tier != 'free' GROUP BY subscription_tier`,
      args: [],
    })

    // Reports pending
    const reportsPending = await turso.execute({
      sql: "SELECT COUNT(*) as count FROM reports WHERE status = 'pending'",
      args: [],
    })

    // Revenue (verified payments)
    const revenue = await turso.execute({
      sql: "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'verified'",
      args: [],
    })

    // Payment breakdown by plan
    const revenueByPlan = await turso.execute({
      sql: "SELECT plan, COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'verified' GROUP BY plan",
      args: [],
    })

    return NextResponse.json({
      stats: {
        total_users: Number(totalUsers.rows[0]?.count || 0),
        active_today: Number(activeToday.rows[0]?.count || 0),
        new_today: Number(newToday.rows[0]?.count || 0),
        premium_counts: premiumCounts.rows.reduce((acc: any, r: any) => {
          acc[r.subscription_tier] = Number(r.count)
          return acc
        }, {}),
        reports_pending: Number(reportsPending.rows[0]?.count || 0),
        total_revenue: Number(revenue.rows[0]?.total || 0),
        revenue_by_plan: revenueByPlan.rows,
      },
    })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch admin stats' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { admin_id, action, target_id, details, name, code, tier, duration_days, max_uses, country_code, description } = body

    if (!admin_id || admin_id !== ADMIN_TELEGRAM_ID) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const logId = crypto.randomUUID()

    const logAction = async (act: string, detail: string) => {
      await turso.execute({
        sql: `INSERT INTO admin_logs (id, admin_id, action, target_id, details, created_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [logId, admin_id, act, target_id || null, detail, now],
      })
    }

    switch (action) {
      case 'ban': {
        if (!target_id) {
          return NextResponse.json({ error: 'target_id is required' }, { status: 400 })
        }
        await turso.execute({
          sql: 'UPDATE profiles SET is_banned = 1, updated_at = ? WHERE id = ?',
          args: [now, target_id],
        })
        await logAction('ban', `Banned user ${target_id}`)
        return NextResponse.json({ success: true, message: 'User banned' })
      }

      case 'unban': {
        if (!target_id) {
          return NextResponse.json({ error: 'target_id is required' }, { status: 400 })
        }
        await turso.execute({
          sql: 'UPDATE profiles SET is_banned = 0, report_count = 0, updated_at = ? WHERE id = ?',
          args: [now, target_id],
        })
        await logAction('unban', `Unbanned user ${target_id}`)
        return NextResponse.json({ success: true, message: 'User unbanned' })
      }

      case 'grant-gold': {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)
        await turso.execute({
          sql: `UPDATE profiles SET subscription_tier = 'gold', subscription_expires_at = ?, updated_at = ?
                WHERE subscription_tier = 'free'`,
          args: [expiresAt.toISOString(), now],
        })
        await logAction('grant-gold', 'Granted Gold tier to all free users')
        return NextResponse.json({ success: true, message: 'Gold tier granted to all free users' })
      }

      case 'broadcast': {
        const message = details || ''
        await logAction('broadcast', `Broadcast: ${message}`)
        return NextResponse.json({ success: true, message: 'Broadcast logged' })
      }

      case 'add-country': {
        if (!name || !code) {
          return NextResponse.json({ error: 'name and code are required' }, { status: 400 })
        }
        const countryId = crypto.randomUUID()
        const flag = details || ''
        await turso.execute({
          sql: `INSERT INTO countries (id, name, code, flag, active, created_at) VALUES (?, ?, ?, ?, 1, ?)`,
          args: [countryId, name, code.toUpperCase(), flag, now],
        })
        await logAction('add-country', `Added country: ${name} (${code})`)
        return NextResponse.json({ success: true, message: `Country ${name} added` })
      }

      case 'add-city': {
        if (!name || !country_code) {
          return NextResponse.json({ error: 'name and country_code are required' }, { status: 400 })
        }
        const cityId = crypto.randomUUID()
        await turso.execute({
          sql: `INSERT INTO cities (id, country_code, name, active, created_at) VALUES (?, ?, ?, 1, ?)`,
          args: [cityId, country_code, name, now],
        })
        await logAction('add-city', `Added city: ${name} to ${country_code}`)
        return NextResponse.json({ success: true, message: `City ${name} added` })
      }

      case 'create-promo': {
        if (!code || !tier) {
          return NextResponse.json({ error: 'code and tier are required' }, { status: 400 })
        }
        const promoId = crypto.randomUUID()
        await turso.execute({
          sql: `INSERT INTO promo_codes (id, code, tier, duration_days, max_uses, current_uses, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, 0, 1, ?)`,
          args: [promoId, code, tier, duration_days || 30, max_uses || 0, now],
        })
        await logAction('create-promo', `Created promo code: ${code} for ${tier} tier`)
        return NextResponse.json({ success: true, message: `Promo code ${code} created` })
      }

      case 'toggle-freemium': {
        const current = await turso.execute({
          sql: "SELECT value FROM app_settings WHERE key = 'freemium_mode'",
          args: [],
        })
        const currentValue = current.rows.length > 0 ? current.rows[0].value : 'true'
        const newValue = currentValue === 'true' ? 'false' : 'true'
        await turso.execute({
          sql: "UPDATE app_settings SET value = ?, updated_at = ? WHERE key = 'freemium_mode'",
          args: [newValue, now],
        })
        await logAction('toggle-freemium', `Freemium mode set to ${newValue}`)
        return NextResponse.json({ success: true, freemium_mode: newValue === 'true' })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Admin action error:', error)
    return NextResponse.json({ error: error.message || 'Admin action failed' }, { status: 500 })
  }
}
