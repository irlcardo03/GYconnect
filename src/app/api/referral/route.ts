import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inviter_id, invitee_id } = body

    if (!inviter_id || !invitee_id) {
      return NextResponse.json(
        { error: 'inviter_id and invitee_id are required' },
        { status: 400 }
      )
    }

    if (inviter_id === invitee_id) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })
    }

    // Check if referral already exists
    const existing = await turso.execute({
      sql: 'SELECT id FROM referrals WHERE inviter_id = ? AND invitee_id = ?',
      args: [inviter_id, invitee_id],
    })

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Referral already tracked' }, { status: 409 })
    }

    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    await turso.execute({
      sql: `INSERT INTO referrals (id, inviter_id, invitee_id, created_at) VALUES (?, ?, ?, ?)`,
      args: [id, inviter_id, invitee_id, now],
    })

    return NextResponse.json({ success: true, referral: { id, inviter_id, invitee_id } })
  } catch (error: any) {
    console.error('Referral error:', error)
    return NextResponse.json({ error: error.message || 'Failed to track referral' }, { status: 500 })
  }
}
