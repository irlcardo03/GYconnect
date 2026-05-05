import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function POST(request: Request) {
  try {
    const { telegram_id, username } = await request.json()

    if (!telegram_id) {
      return NextResponse.json({ error: 'telegram_id is required' }, { status: 400 })
    }

    const adminTelegramId = process.env.ADMIN_TELEGRAM_ID

    // Check if this is the admin
    if (adminTelegramId && String(telegram_id) === String(adminTelegramId)) {
      // Find existing admin profile
      const existing = await turso.execute({
        sql: 'SELECT * FROM profiles WHERE telegram_id = ?',
        args: [String(telegram_id)]
      })

      if (existing.rows.length > 0) {
        const profile = existing.rows[0]
        // Ensure is_admin is set
        if (Number(profile.is_admin) !== 1) {
          await turso.execute({
            sql: 'UPDATE profiles SET is_admin = 1, updated_at = datetime(\'now\') WHERE id = ?',
            args: [String(profile.id)]
          })
        }
        return NextResponse.json({ profile, isNew: false })
      }

      // Create admin profile
      const id = crypto.randomUUID()
      await turso.execute({
        sql: `INSERT INTO profiles (id, telegram_id, username, is_admin, subscription_tier)
              VALUES (?, ?, ?, 1, 'gold')`,
        args: [id, String(telegram_id), username || '']
      })

      const result = await turso.execute({
        sql: 'SELECT * FROM profiles WHERE id = ?',
        args: [id]
      })

      return NextResponse.json({ profile: result.rows[0], isNew: false })
    }

    // Non-admin: find or create profile
    const existing = await turso.execute({
      sql: 'SELECT * FROM profiles WHERE telegram_id = ?',
      args: [String(telegram_id)]
    })

    if (existing.rows.length > 0) {
      const profile = existing.rows[0]
      // Update username if provided
      if (username && String(profile.username) !== username) {
        await turso.execute({
          sql: 'UPDATE profiles SET username = ?, updated_at = datetime(\'now\') WHERE id = ?',
          args: [username, String(profile.id)]
        })
      }
      // Update last_active
      await turso.execute({
        sql: 'UPDATE profiles SET last_active = datetime(\'now\') WHERE id = ?',
        args: [String(profile.id)]
      })

      const updated = await turso.execute({
        sql: 'SELECT * FROM profiles WHERE id = ?',
        args: [String(profile.id)]
      })

      const isNew = !String(updated.rows[0].first_name)
      return NextResponse.json({ profile: updated.rows[0], isNew })
    }

    // Create new profile
    const id = crypto.randomUUID()
    await turso.execute({
      sql: `INSERT INTO profiles (id, telegram_id, username)
            VALUES (?, ?, ?)`,
      args: [id, String(telegram_id), username || '']
    })

    const result = await turso.execute({
      sql: 'SELECT * FROM profiles WHERE id = ?',
      args: [id]
    })

    return NextResponse.json({ profile: result.rows[0], isNew: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
