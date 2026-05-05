import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function POST(request: Request) {
  try {
    const { sender_id, chat_id, type, data, expires_at } = await request.json()

    if (!sender_id || !chat_id || !type || !data || !expires_at) {
      return NextResponse.json({ error: 'sender_id, chat_id, type, data, and expires_at are required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await turso.execute({
      sql: 'INSERT INTO ephemeral_media (id, sender_id, chat_id, type, data, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, sender_id, chat_id, type, data, expires_at]
    })

    const result = await turso.execute({
      sql: 'SELECT * FROM ephemeral_media WHERE id = ?',
      args: [id]
    })

    return NextResponse.json({ media: result.rows[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const result = await turso.execute({
      sql: 'SELECT * FROM ephemeral_media WHERE id = ?',
      args: [id]
    })

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Mark as viewed and increment view count
    await turso.execute({
      sql: 'UPDATE ephemeral_media SET viewed = 1, view_count = view_count + 1 WHERE id = ?',
      args: [id]
    })

    const updated = await turso.execute({
      sql: 'SELECT * FROM ephemeral_media WHERE id = ?',
      args: [id]
    })

    return NextResponse.json({ media: updated.rows[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
