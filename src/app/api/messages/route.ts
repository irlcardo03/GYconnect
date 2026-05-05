import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chat_id = searchParams.get('chat_id')

    if (!chat_id) {
      return NextResponse.json({ error: 'chat_id is required' }, { status: 400 })
    }

    const result = await turso.execute({
      sql: 'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC LIMIT 50',
      args: [chat_id]
    })

    return NextResponse.json({ messages: result.rows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { chat_id, sender_id, content, type = 'text' } = await request.json()

    if (!chat_id || !sender_id || !content) {
      return NextResponse.json({ error: 'chat_id, sender_id, and content are required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await turso.execute({
      sql: 'INSERT INTO messages (id, chat_id, sender_id, content, type) VALUES (?, ?, ?, ?, ?)',
      args: [id, chat_id, sender_id, content, type]
    })

    const result = await turso.execute({
      sql: 'SELECT * FROM messages WHERE id = ?',
      args: [id]
    })

    return NextResponse.json({ message: result.rows[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
