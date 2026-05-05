import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const profile_id = searchParams.get('profile_id')

    if (!profile_id) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }

    // Get all chat_ids for this profile
    const memberOf = await turso.execute({
      sql: 'SELECT chat_id FROM chat_members WHERE profile_id = ?',
      args: [profile_id]
    })

    if (memberOf.rows.length === 0) {
      return NextResponse.json({ chats: [] })
    }

    const chatIds = memberOf.rows.map(r => String(r.chat_id))

    // Get chats with last message info
    const chats: any[] = []
    for (const chatId of chatIds) {
      const chatResult = await turso.execute({
        sql: 'SELECT * FROM chats WHERE id = ?',
        args: [chatId]
      })

      if (chatResult.rows.length === 0) continue

      const chat = chatResult.rows[0]

      // Get last message
      const lastMsg = await turso.execute({
        sql: 'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1',
        args: [chatId]
      })

      let otherProfile = null
      if (String(chat.type) === 'direct') {
        // Get the other member's profile
        const otherMember = await turso.execute({
          sql: 'SELECT profile_id FROM chat_members WHERE chat_id = ? AND profile_id != ?',
          args: [chatId, profile_id]
        })

        if (otherMember.rows.length > 0) {
          const profileResult = await turso.execute({
            sql: 'SELECT id, username, first_name, mood, subscription_tier FROM profiles WHERE id = ?',
            args: [String(otherMember.rows[0].profile_id)]
          })
          if (profileResult.rows.length > 0) {
            otherProfile = profileResult.rows[0]
          }
        }
      }

      chats.push({
        ...chat,
        last_message: lastMsg.rows.length > 0 ? lastMsg.rows[0] : null,
        other_profile: otherProfile
      })
    }

    return NextResponse.json({ chats })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
