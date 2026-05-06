import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, profile_id } = body

    if (!code || !profile_id) {
      return NextResponse.json({ error: 'code and profile_id are required' }, { status: 400 })
    }

    // Find the promo code
    const promoResult = await turso.execute({
      sql: 'SELECT * FROM promo_codes WHERE code = ? AND is_active = 1',
      args: [code],
    })

    if (promoResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or inactive promo code' }, { status: 404 })
    }

    const promo = promoResult.rows[0]

    // Check max uses (0 = unlimited)
    if (Number(promo.max_uses) > 0 && Number(promo.current_uses) >= Number(promo.max_uses)) {
      return NextResponse.json({ error: 'Promo code has reached maximum uses' }, { status: 400 })
    }

    // Check if user already used this promo
    const usageCheck = await turso.execute({
      sql: 'SELECT id FROM promo_code_usage WHERE promo_code_id = ? AND profile_id = ?',
      args: [promo.id, profile_id],
    })

    if (usageCheck.rows.length > 0) {
      return NextResponse.json({ error: 'You have already used this promo code' }, { status: 409 })
    }

    const now = new Date().toISOString()

    // Record usage
    const usageId = crypto.randomUUID()
    await turso.execute({
      sql: `INSERT INTO promo_code_usage (id, promo_code_id, profile_id, used_at) VALUES (?, ?, ?, ?)`,
      args: [usageId, promo.id, profile_id, now],
    })

    // Increment usage count
    await turso.execute({
      sql: 'UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = ?',
      args: [promo.id],
    })

    // Apply subscription tier
    const durationDays = Number(promo.duration_days) || 30
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    await turso.execute({
      sql: `UPDATE profiles SET subscription_tier = ?, subscription_expires_at = ?, updated_at = ?
            WHERE id = ?`,
      args: [String(promo.tier), expiresAt.toISOString(), now, profile_id],
    })

    // If max uses reached after increment, deactivate
    if (Number(promo.max_uses) > 0 && Number(promo.current_uses) + 1 >= Number(promo.max_uses)) {
      await turso.execute({
        sql: 'UPDATE promo_codes SET is_active = 0 WHERE id = ?',
        args: [promo.id],
      })
    }

    return NextResponse.json({
      success: true,
      tier: promo.tier,
      duration_days: durationDays,
      expires_at: expiresAt.toISOString(),
      message: `${String(promo.tier).charAt(0).toUpperCase() + String(promo.tier).slice(1)} plan activated for ${durationDays} days!`,
    })
  } catch (error: any) {
    console.error('Promo error:', error)
    return NextResponse.json({ error: error.message || 'Failed to redeem promo code' }, { status: 500 })
  }
}
