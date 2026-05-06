import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country_code = searchParams.get('country_code')
    const profile_id = searchParams.get('profile_id')

    if (!country_code) {
      return NextResponse.json({ error: 'country_code is required' }, { status: 400 })
    }

    const result = await turso.execute({
      sql: `SELECT g.* FROM groups g
            WHERE g.country_code = ?
            ORDER BY g.is_default DESC, g.name ASC`,
      args: [country_code],
    })

    // Enrich with member count and membership status
    const groups = []
    for (const group of result.rows) {
      const memberCount = await turso.execute({
        sql: 'SELECT member_count FROM groups WHERE id = ?',
        args: [group.id],
      })

      let is_member = false
      if (profile_id) {
        const membership = await turso.execute({
          sql: 'SELECT id FROM group_members WHERE group_id = ? AND profile_id = ?',
          args: [group.id, profile_id],
        })
        is_member = membership.rows.length > 0
      }

      groups.push({
        ...group,
        member_count: Number(memberCount.rows[0]?.member_count || 0),
        is_member,
      })
    }

    return NextResponse.json({ groups })
  } catch (error: any) {
    console.error('Groups error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, group_id, profile_id, name, description, country_code, created_by } = body

    // Join a group
    if (action === 'join' || (group_id && profile_id && !name)) {
      if (!group_id || !profile_id) {
        return NextResponse.json({ error: 'group_id and profile_id are required' }, { status: 400 })
      }

      const now = new Date().toISOString()

      // Check if already a member
      const existing = await turso.execute({
        sql: 'SELECT id FROM group_members WHERE group_id = ? AND profile_id = ?',
        args: [group_id, profile_id],
      })

      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Already a member of this group' }, { status: 409 })
      }

      const memberId = crypto.randomUUID()
      await turso.execute({
        sql: `INSERT INTO group_members (id, group_id, profile_id, joined_at) VALUES (?, ?, ?, ?)`,
        args: [memberId, group_id, profile_id, now],
      })

      // Increment member count
      await turso.execute({
        sql: 'UPDATE groups SET member_count = member_count + 1 WHERE id = ?',
        args: [group_id],
      })

      return NextResponse.json({ success: true, message: 'Joined group successfully' })
    }

    // Create a new group
    if (name) {
      if (!country_code) {
        return NextResponse.json({ error: 'country_code is required' }, { status: 400 })
      }

      const now = new Date().toISOString()
      const id = crypto.randomUUID()

      await turso.execute({
        sql: `INSERT INTO groups (id, country_code, name, description, created_by, created_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [id, country_code, name, description || '', created_by || null, now],
      })

      // If creator provided, add them as member
      if (created_by) {
        const memberId = crypto.randomUUID()
        await turso.execute({
          sql: `INSERT INTO group_members (id, group_id, profile_id, joined_at) VALUES (?, ?, ?, ?)`,
          args: [memberId, id, created_by, now],
        })
        await turso.execute({
          sql: 'UPDATE groups SET member_count = member_count + 1 WHERE id = ?',
          args: [id],
        })
      }

      const result = await turso.execute({
        sql: 'SELECT * FROM groups WHERE id = ?',
        args: [id],
      })

      return NextResponse.json({ group: result.rows[0] }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid request. Provide action=join or group name.' }, { status: 400 })
  } catch (error: any) {
    console.error('Groups POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process group request' }, { status: 500 })
  }
}
