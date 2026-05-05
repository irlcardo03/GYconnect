import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function POST(request: Request) {
  try {
    const { profile_id, txid, network, amount, plan } = await request.json()

    if (!profile_id || !txid || !network || !amount || !plan) {
      return NextResponse.json({ error: 'profile_id, txid, network, amount, and plan are required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await turso.execute({
      sql: 'INSERT INTO payments (id, profile_id, txid, network, amount, plan, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [id, profile_id, txid, network, amount, plan, 'pending']
    })

    const result = await turso.execute({
      sql: 'SELECT * FROM payments WHERE id = ?',
      args: [id]
    })

    return NextResponse.json({ payment: result.rows[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const profile_id = searchParams.get('profile_id')

    if (!profile_id) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }

    const result = await turso.execute({
      sql: 'SELECT * FROM payments WHERE profile_id = ? ORDER BY created_at DESC',
      args: [profile_id]
    })

    return NextResponse.json({ payments: result.rows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
