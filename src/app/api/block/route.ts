import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function POST(request: Request) {
  try {
    const { blocker_id, blocked_id } = await request.json()

    if (!blocker_id || !blocked_id) {
      return NextResponse.json({ error: 'blocker_id and blocked_id are required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await turso.execute({
      sql: 'INSERT OR IGNORE INTO blocks (id, blocker_id, blocked_id) VALUES (?, ?, ?)',
      args: [id, blocker_id, blocked_id]
    })

    return NextResponse.json({ status: 'blocked' })
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
      sql: `SELECT b.*, p.username, p.first_name FROM blocks b
            LEFT JOIN profiles p ON b.blocked_id = p.id
            WHERE b.blocker_id = ?`,
      args: [profile_id]
    })

    return NextResponse.json({ blocked: result.rows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
