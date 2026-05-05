import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const country_code = searchParams.get('country_code')

    if (!country_code) {
      return NextResponse.json({ error: 'country_code is required' }, { status: 400 })
    }

    const result = await turso.execute({
      sql: 'SELECT * FROM groups WHERE country_code = ? ORDER BY is_default DESC, name ASC',
      args: [country_code]
    })

    return NextResponse.json({ groups: result.rows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { country_code, name, description, created_by } = await request.json()

    if (!country_code || !name) {
      return NextResponse.json({ error: 'country_code and name are required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await turso.execute({
      sql: 'INSERT INTO groups (id, country_code, name, description, created_by) VALUES (?, ?, ?, ?, ?)',
      args: [id, country_code, name, description || '', created_by || null]
    })

    // Add creator as member
    if (created_by) {
      const memberId = crypto.randomUUID()
      await turso.execute({
        sql: 'INSERT OR IGNORE INTO group_members (id, group_id, profile_id) VALUES (?, ?, ?)',
        args: [memberId, id, created_by]
      })
      // Update member count
      await turso.execute({
        sql: 'UPDATE groups SET member_count = member_count + 1 WHERE id = ?',
        args: [id]
      })
    }

    const result = await turso.execute({
      sql: 'SELECT * FROM groups WHERE id = ?',
      args: [id]
    })

    return NextResponse.json({ group: result.rows[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
