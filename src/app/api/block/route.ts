import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { blocker_id, blocked_id } = body

    if (!blocker_id || !blocked_id) {
      return NextResponse.json({ error: 'blocker_id and blocked_id are required' }, { status: 400 })
    }

    if (blocker_id === blocked_id) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    try {
      await turso.execute({
        sql: `INSERT INTO blocks (id, blocker_id, blocked_id, created_at) VALUES (?, ?, ?, ?)`,
        args: [id, blocker_id, blocked_id, now],
      })
    } catch (insertError: any) {
      if (insertError.message?.includes('UNIQUE constraint')) {
        return NextResponse.json({ error: 'User already blocked' }, { status: 409 })
      }
      throw insertError
    }

    // Also remove any existing matches between these users
    await turso.execute({
      sql: `UPDATE matches SET is_matched = 0
            WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)`,
      args: [blocker_id, blocked_id, blocked_id, blocker_id],
    })

    return NextResponse.json({ success: true, message: 'User blocked' })
  } catch (error: any) {
    console.error('Block error:', error)
    return NextResponse.json({ error: error.message || 'Failed to block user' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const blocker_id = searchParams.get('blocker_id')
    const blocked_id = searchParams.get('blocked_id')

    if (!blocker_id || !blocked_id) {
      return NextResponse.json({ error: 'blocker_id and blocked_id are required' }, { status: 400 })
    }

    const result = await turso.execute({
      sql: 'DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
      args: [blocker_id, blocked_id],
    })

    if ((result.rowsAffected ?? 0) === 0) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'User unblocked' })
  } catch (error: any) {
    console.error('Unblock error:', error)
    return NextResponse.json({ error: error.message || 'Failed to unblock user' }, { status: 500 })
  }
}
