import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function POST(request: Request) {
  try {
    const { reporter_id, reported_id, reason, description } = await request.json()

    if (!reporter_id || !reported_id || !reason) {
      return NextResponse.json({ error: 'reporter_id, reported_id, and reason are required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await turso.execute({
      sql: 'INSERT INTO reports (id, reporter_id, reported_id, reason, description) VALUES (?, ?, ?, ?, ?)',
      args: [id, reporter_id, reported_id, reason, description || '']
    })

    // Increment report count on the reported profile
    await turso.execute({
      sql: 'UPDATE profiles SET report_count = report_count + 1 WHERE id = ?',
      args: [reported_id]
    })

    const result = await turso.execute({
      sql: 'SELECT * FROM reports WHERE id = ?',
      args: [id]
    })

    return NextResponse.json({ report: result.rows[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
