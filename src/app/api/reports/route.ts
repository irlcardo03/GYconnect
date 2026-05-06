import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

const ADMIN_TELEGRAM_ID = '8262090447'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reporter_id, reported_id, reason, description } = body

    if (!reporter_id || !reported_id || !reason) {
      return NextResponse.json(
        { error: 'reporter_id, reported_id, and reason are required' },
        { status: 400 }
      )
    }

    if (reporter_id === reported_id) {
      return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    try {
      await turso.execute({
        sql: `INSERT INTO reports (id, reporter_id, reported_id, reason, description, status, created_at)
              VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
        args: [id, reporter_id, reported_id, reason, description || '', now],
      })
    } catch (insertError: any) {
      if (insertError.message?.includes('UNIQUE constraint')) {
        return NextResponse.json(
          { error: 'You have already reported this user' },
          { status: 409 }
        )
      }
      throw insertError
    }

    // Increment report count on the reported profile
    await turso.execute({
      sql: 'UPDATE profiles SET report_count = report_count + 1 WHERE id = ?',
      args: [reported_id],
    })

    // Check if reported user's report_count >= 5 → auto-ban
    const profileCheck = await turso.execute({
      sql: 'SELECT report_count FROM profiles WHERE id = ?',
      args: [reported_id],
    })

    let autoBanned = false
    if (profileCheck.rows.length > 0 && Number(profileCheck.rows[0].report_count) >= 5) {
      await turso.execute({
        sql: 'UPDATE profiles SET is_banned = 1 WHERE id = ?',
        args: [reported_id],
      })
      autoBanned = true
    }

    return NextResponse.json({
      success: true,
      report: { id, reporter_id, reported_id, reason, status: 'pending' },
      auto_banned: autoBanned,
    })
  } catch (error: any) {
    console.error('Report error:', error)
    return NextResponse.json({ error: error.message || 'Failed to submit report' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const admin_id = searchParams.get('admin_id')

    if (!admin_id || admin_id !== ADMIN_TELEGRAM_ID) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const result = await turso.execute({
      sql: `SELECT r.*,
            rp.first_name as reporter_name, rp.telegram_id as reporter_telegram_id,
            rd.first_name as reported_name, rd.telegram_id as reported_telegram_id
            FROM reports r
            LEFT JOIN profiles rp ON r.reporter_id = rp.id
            LEFT JOIN profiles rd ON r.reported_id = rd.id
            ORDER BY r.created_at DESC`,
      args: [],
    })

    return NextResponse.json({ reports: result.rows })
  } catch (error: any) {
    console.error('Get reports error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch reports' }, { status: 500 })
  }
}
