import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function POST(request: Request) {
  try {
    const { inviter_id, invitee_id } = await request.json()

    if (!inviter_id || !invitee_id) {
      return NextResponse.json({ error: 'inviter_id and invitee_id are required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await turso.execute({
      sql: 'INSERT INTO referrals (id, inviter_id, invitee_id) VALUES (?, ?, ?)',
      args: [id, inviter_id, invitee_id]
    })

    return NextResponse.json({ status: 'recorded', referral_id: id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
