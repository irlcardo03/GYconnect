import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chat_id = searchParams.get('chat_id')
    const profile_id = searchParams.get('profile_id')

    if (!chat_id) {
      return NextResponse.json({ error: 'chat_id is required' }, { status: 400 })
    }

    // Fetch messages ordered by created_at ASC
    const result = await turso.execute({
      sql: `SELECT m.*, p.first_name as sender_name
            FROM messages m
            LEFT JOIN profiles p ON m.sender_id = p.id
            WHERE m.chat_id = ?
            ORDER BY m.created_at ASC`,
      args: [chat_id],
    })

    // Mark unread messages as read for this profile
    if (profile_id) {
      await turso.execute({
        sql: `UPDATE messages SET is_read = 1
              WHERE chat_id = ? AND sender_id != ? AND is_read = 0`,
        args: [chat_id, profile_id],
      })
    }

    return NextResponse.json({ messages: result.rows })
  } catch (error: any) {
    console.error('Messages error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 })
  }
}
