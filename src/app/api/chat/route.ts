import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profile_id = searchParams.get('profile_id')

    if (!profile_id) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }

    // Get all chats for this profile
    const chats = await turso.execute({
      sql: `SELECT ch.id as chat_id, ch.type, ch.name, ch.created_at,
            cm2.profile_id as other_profile_id
            FROM chat_members cm
            JOIN chats ch ON cm.chat_id = ch.id
            JOIN chat_members cm2 ON cm.chat_id = cm2.chat_id AND cm2.profile_id != ?
            WHERE cm.profile_id = ?
            ORDER BY ch.created_at DESC`,
      args: [profile_id, profile_id],
    })

    const chatList: any[] = []

    for (const chat of chats.rows) {
      // Get other user's profile info
      const otherProfile = await turso.execute({
        sql: `SELECT p.id, p.first_name, p.age, p.mood, p.subscription_tier,
              c.name as city_name, co.name as country_name, co.flag as country_flag
              FROM profiles p
              LEFT JOIN cities c ON p.city_id = c.id
              LEFT JOIN countries co ON p.country_code = co.code
              WHERE p.id = ?`,
        args: [chat.other_profile_id],
      })

      // Get last message
      const lastMsg = await turso.execute({
        sql: `SELECT id, sender_id, content, type, created_at
              FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1`,
        args: [chat.chat_id],
      })

      // Get unread count
      const unread = await turso.execute({
        sql: `SELECT COUNT(*) as count FROM messages
              WHERE chat_id = ? AND sender_id != ? AND is_read = 0`,
        args: [chat.chat_id, profile_id],
      })

      chatList.push({
        chat_id: chat.chat_id,
        chat_type: chat.type,
        chat_name: chat.name,
        other_user: otherProfile.rows.length > 0 ? otherProfile.rows[0] : null,
        last_message: lastMsg.rows.length > 0 ? lastMsg.rows[0] : null,
        unread_count: Number(unread.rows[0]?.count || 0),
      })
    }

    // Sort by last message time (most recent first)
    chatList.sort((a, b) => {
      const aTime = a.last_message?.created_at || ''
      const bTime = b.last_message?.created_at || ''
      return bTime.localeCompare(aTime)
    })

    return NextResponse.json({ chats: chatList })
  } catch (error: any) {
    console.error('Chat list error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch chats' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chat_id, sender_id, content, type = 'text', media_id } = body

    if (!chat_id || !sender_id || !content) {
      return NextResponse.json(
        { error: 'chat_id, sender_id, and content are required' },
        { status: 400 }
      )
    }

    if (!['text', 'photo', 'voice'].includes(type)) {
      return NextResponse.json({ error: 'type must be text, photo, or voice' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    await turso.execute({
      sql: `INSERT INTO messages (id, chat_id, sender_id, content, type, media_id, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      args: [id, chat_id, sender_id, content, type, media_id || null, now],
    })

    // Fetch the saved message
    const result = await turso.execute({
      sql: 'SELECT * FROM messages WHERE id = ?',
      args: [id],
    })

    return NextResponse.json({ message: result.rows[0] })
  } catch (error: any) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 })
  }
}
