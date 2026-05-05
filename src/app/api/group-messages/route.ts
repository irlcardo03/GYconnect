import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const group_id = searchParams.get('group_id')

    if (!group_id) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 })
    }

    const result = await turso.execute({
      sql: `SELECT gm.*, p.first_name as sender_name
            FROM group_messages gm
            LEFT JOIN profiles p ON gm.sender_id = p.id
            WHERE gm.group_id = ?
            ORDER BY gm.created_at ASC`,
      args: [group_id],
    })

    return NextResponse.json({ messages: result.rows })
  } catch (error: any) {
    console.error('Group messages error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch group messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { group_id, sender_id, content, type } = body

    if (!group_id || !sender_id || !content) {
      return NextResponse.json({ error: 'group_id, sender_id, and content are required' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    await turso.execute({
      sql: `INSERT INTO group_messages (id, group_id, sender_id, content, type, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, group_id, sender_id, content, type || 'text', now],
    })

    return NextResponse.json({ success: true, message_id: id })
  } catch (error: any) {
    console.error('Group message POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send group message' }, { status: 500 })
  }
}
