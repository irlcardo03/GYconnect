import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function POST(request: Request) {
  try {
    const { code, profile_id } = await request.json()

    if (!code || !profile_id) {
      return NextResponse.json({ error: 'code and profile_id are required' }, { status: 400 })
    }

    // Find promo code
    const promoResult = await turso.execute({
      sql: 'SELECT * FROM promo_codes WHERE code = ? AND is_active = 1',
      args: [code]
    })

    if (promoResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or inactive promo code' }, { status: 404 })
    }

    const promo = promoResult.rows[0]

    // Check max uses
    if (Number(promo.max_uses) > 0 && Number(promo.current_uses) >= Number(promo.max_uses)) {
      return NextResponse.json({ error: 'Promo code has reached max uses' }, { status: 400 })
    }

    // Check if already used by this profile
    const usageCheck = await turso.execute({
      sql: 'SELECT id FROM promo_code_usage WHERE promo_code_id = ? AND profile_id = ?',
      args: [String(promo.id), profile_id]
    })

    if (usageCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Promo code already used' }, { status: 400 })
    }

    // Record usage
    const usageId = crypto.randomUUID()
    await turso.execute({
      sql: 'INSERT INTO promo_code_usage (id, promo_code_id, profile_id) VALUES (?, ?, ?)',
      args: [usageId, String(promo.id), profile_id]
    })

    // Increment current_uses
    await turso.execute({
      sql: 'UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = ?',
      args: [String(promo.id)]
    })

    // Update profile subscription
    const durationDays = Number(promo.duration_days) || 30
    await turso.execute({
      sql: `UPDATE profiles SET subscription_tier = ?, subscription_expires_at = datetime('now', '+' || ? || ' days'), updated_at = datetime('now') WHERE id = ?`,
      args: [String(promo.tier), durationDays, profile_id]
    })

    // Check if max uses reached, deactivate
    if (Number(promo.max_uses) > 0 && Number(promo.current_uses) + 1 >= Number(promo.max_uses)) {
      await turso.execute({
        sql: 'UPDATE promo_codes SET is_active = 0 WHERE id = ?',
        args: [String(promo.id)]
      })
    }

    const updatedProfile = await turso.execute({
      sql: 'SELECT * FROM profiles WHERE id = ?',
      args: [profile_id]
    })

    return NextResponse.json({
      success: true,
      tier: String(promo.tier),
      duration_days: durationDays,
      profile: updatedProfile.rows[0]
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
