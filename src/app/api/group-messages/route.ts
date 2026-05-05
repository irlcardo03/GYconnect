import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const group_id = searchParams.get('group_id')

    if (!group_id) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 })
    }

    const result = await turso.execute({
      sql: 'SELECT * FROM group_messages WHERE group_id = ? ORDER BY created_at ASC LIMIT 50',
      args: [group_id]
    })

    return NextResponse.json({ messages: result.rows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { group_id, sender_id, content } = await request.json()

    if (!group_id || !sender_id || !content) {
      return NextResponse.json({ error: 'group_id, sender_id, and content are required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await turso.execute({
      sql: 'INSERT INTO group_messages (id, group_id, sender_id, content) VALUES (?, ?, ?, ?)',
      args: [id, group_id, sender_id, content]
    })

    const result = await turso.execute({
      sql: 'SELECT * FROM group_messages WHERE id = ?',
      args: [id]
    })

    return NextResponse.json({ message: result.rows[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
