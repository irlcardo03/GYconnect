import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, type, sender_id, chat_id } = body

    if (!data || !type || !sender_id || !chat_id) {
      return NextResponse.json(
        { error: 'data, type, sender_id, and chat_id are required' },
        { status: 400 }
      )
    }

    if (!['photo', 'voice'].includes(type)) {
      return NextResponse.json({ error: 'type must be photo or voice' }, { status: 400 })
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes from now
    const id = crypto.randomUUID()

    await turso.execute({
      sql: `INSERT INTO ephemeral_media (id, sender_id, chat_id, type, data, viewed, view_count, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      args: [id, sender_id, chat_id, type, data, expiresAt.toISOString(), now.toISOString()],
    })

    return NextResponse.json({
      media_id: id,
      type,
      expires_at: expiresAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Media upload error:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload media' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const result = await turso.execute({
      sql: 'SELECT * FROM ephemeral_media WHERE id = ?',
      args: [id],
    })

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    const media = result.rows[0]
    const now = new Date()

    // Check if expired
    if (media.expires_at && new Date(String(media.expires_at)).getTime() < now.getTime()) {
      // Delete expired media
      await turso.execute({
        sql: 'DELETE FROM ephemeral_media WHERE id = ?',
        args: [id],
      })
      return NextResponse.json({ error: 'Media has expired' }, { status: 404 })
    }

    // For photos, increment view count
    if (media.type === 'photo') {
      const newViewCount = Number(media.view_count) + 1

      if (newViewCount >= 1) {
        // Delete after returning (view-once for photos)
        await turso.execute({
          sql: 'DELETE FROM ephemeral_media WHERE id = ?',
          args: [id],
        })
      } else {
        await turso.execute({
          sql: 'UPDATE ephemeral_media SET view_count = ?, viewed = 1 WHERE id = ?',
          args: [newViewCount, id],
        })
      }
    }

    return NextResponse.json({
      media: {
        id: media.id,
        type: media.type,
        data: media.data,
        sender_id: media.sender_id,
        chat_id: media.chat_id,
        expires_at: media.expires_at,
        created_at: media.created_at,
      },
    })
  } catch (error: any) {
    console.error('Media view error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch media' }, { status: 500 })
  }
}
