import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function POST(request: Request) {
  try {
    const { from_id, to_id, type } = await request.json()

    if (!from_id || !to_id || !type) {
      return NextResponse.json({ error: 'from_id, to_id, and type are required' }, { status: 400 })
    }

    if (type === 'pass') {
      // Record the pass
      const id = crypto.randomUUID()
      await turso.execute({
        sql: 'INSERT OR IGNORE INTO matches (id, from_id, to_id, type) VALUES (?, ?, ?, ?)',
        args: [id, from_id, to_id, 'pass']
      })
      return NextResponse.json({ matched: false })
    }

    // Like or superlike
    const matchId = crypto.randomUUID()
    await turso.execute({
      sql: 'INSERT OR IGNORE INTO matches (id, from_id, to_id, type) VALUES (?, ?, ?, ?)',
      args: [matchId, from_id, to_id, type]
    })

    // Check for reverse like/superlike
    const reverse = await turso.execute({
      sql: `SELECT * FROM matches WHERE from_id = ? AND to_id = ? AND type IN ('like', 'superlike')`,
      args: [to_id, from_id]
    })

    if (reverse.rows.length > 0) {
      // Mutual match! Create chat room
      const chatId = crypto.randomUUID()
      await turso.execute({
        sql: 'INSERT INTO chats (id, type, name) VALUES (?, ?, ?)',
        args: [chatId, 'direct', '']
      })

      const member1Id = crypto.randomUUID()
      const member2Id = crypto.randomUUID()
      await turso.execute({
        sql: 'INSERT INTO chat_members (id, chat_id, profile_id) VALUES (?, ?, ?)',
        args: [member1Id, chatId, from_id]
      })
      await turso.execute({
        sql: 'INSERT INTO chat_members (id, chat_id, profile_id) VALUES (?, ?, ?)',
        args: [member2Id, chatId, to_id]
      })

      // Mark both matches as matched
      await turso.execute({
        sql: 'UPDATE matches SET is_matched = 1 WHERE from_id = ? AND to_id = ?',
        args: [from_id, to_id]
      })
      await turso.execute({
        sql: 'UPDATE matches SET is_matched = 1 WHERE from_id = ? AND to_id = ?',
        args: [to_id, from_id]
      })

      return NextResponse.json({ matched: true, chat_id: chatId })
    }

    return NextResponse.json({ matched: false })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
