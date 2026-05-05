import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const result = await turso.execute({
      sql: 'SELECT * FROM profiles WHERE id = ?',
      args: [id]
    })

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile: result.rows[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const allowedFields = [
      'first_name', 'age', 'country_code', 'city_id', 'position',
      'looking_for', 'bio', 'mood', 'tags', 'vibes', 'username'
    ]

    const updates: string[] = []
    const values: any[] = []

    for (const key of allowedFields) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`)
        values.push(fields[key])
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    updates.push("updated_at = datetime('now')")
    values.push(id)

    await turso.execute({
      sql: `UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`,
      args: values
    })

    const result = await turso.execute({
      sql: 'SELECT * FROM profiles WHERE id = ?',
      args: [id]
    })

    return NextResponse.json({ profile: result.rows[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
