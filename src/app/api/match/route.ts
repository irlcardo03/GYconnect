import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from_id, to_id, type = 'like' } = body

    if (!from_id || !to_id) {
      return NextResponse.json({ error: 'from_id and to_id are required' }, { status: 400 })
    }

    if (from_id === to_id) {
      return NextResponse.json({ error: 'Cannot like yourself' }, { status: 400 })
    }

    if (!['like', 'super_like'].includes(type)) {
      return NextResponse.json({ error: 'type must be like or super_like' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // Check if already liked
    const existing = await turso.execute({
      sql: 'SELECT id FROM matches WHERE from_id = ? AND to_id = ?',
      args: [from_id, to_id],
    })

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Already liked this user' }, { status: 409 })
    }

    const matchId = crypto.randomUUID()

    // Check if reverse like exists (they already liked us)
    const reverseLike = await turso.execute({
      sql: 'SELECT id FROM matches WHERE from_id = ? AND to_id = ?',
      args: [to_id, from_id],
    })

    const isMatched = reverseLike.rows.length > 0

    // Insert the like
    await turso.execute({
      sql: `INSERT INTO matches (id, from_id, to_id, type, is_matched, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [matchId, from_id, to_id, type, isMatched ? 1 : 0, now],
    })

    let chatId: string | null = null

    if (isMatched) {
      // Update reverse like to is_matched = 1
      await turso.execute({
        sql: 'UPDATE matches SET is_matched = 1 WHERE from_id = ? AND to_id = ?',
        args: [to_id, from_id],
      })

      // Create a chat room
      chatId = crypto.randomUUID()
      await turso.execute({
        sql: `INSERT INTO chats (id, type, name, created_at) VALUES (?, 'direct', '', ?)`,
        args: [chatId, now],
      })

      // Add both members to the chat
      const member1Id = crypto.randomUUID()
      const member2Id = crypto.randomUUID()
      await turso.execute({
        sql: `INSERT INTO chat_members (id, chat_id, profile_id, joined_at) VALUES (?, ?, ?, ?)`,
        args: [member1Id, chatId, from_id, now],
      })
      await turso.execute({
        sql: `INSERT INTO chat_members (id, chat_id, profile_id, joined_at) VALUES (?, ?, ?, ?)`,
        args: [member2Id, chatId, to_id, now],
      })
    }

    return NextResponse.json({
      match: {
        id: matchId,
        from_id,
        to_id,
        type,
        is_matched: isMatched,
      },
      chat_id: chatId,
      is_new_match: isMatched,
    })
  } catch (error: any) {
    console.error('Match error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process like' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profile_id = searchParams.get('profile_id')

    if (!profile_id) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }

    // Get all matched profiles (where is_matched = 1)
    const result = await turso.execute({
      sql: `SELECT m.id as match_id, m.type, m.created_at as matched_at,
            p.id as profile_id, p.first_name, p.age, p.bio, p.mood, p.tags, p.vibes,
            p.position, p.looking_for, p.subscription_tier,
            p.city_id, c.name as city_name, co.name as country_name, co.flag as country_flag,
            ch.id as chat_id
            FROM matches m
            JOIN profiles p ON (
              CASE WHEN m.from_id = ? THEN m.to_id = p.id
                   ELSE m.from_id = p.id END
            )
            LEFT JOIN cities c ON p.city_id = c.id
            LEFT JOIN countries co ON p.country_code = co.code
            LEFT JOIN chat_members cm ON cm.profile_id = ?
            LEFT JOIN chats ch ON ch.id = cm.chat_id AND ch.type = 'direct'
            WHERE (m.from_id = ? OR m.to_id = ?)
            AND m.is_matched = 1
            ORDER BY m.created_at DESC`,
      args: [profile_id, profile_id, profile_id, profile_id],
    })

    const matches = result.rows.map((r: any) => ({
      ...r,
      tags: r.tags ? String(r.tags).split(',').filter(Boolean) : [],
      vibes: r.vibes ? String(r.vibes).split(',').filter(Boolean) : [],
    }))

    return NextResponse.json({ matches })
  } catch (error: any) {
    console.error('Get matches error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch matches' }, { status: 500 })
  }
}
