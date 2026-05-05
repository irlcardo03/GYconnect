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
      sql: 'SELECT * FROM cities WHERE country_code = ? AND active = 1 ORDER BY name',
      args: [country_code]
    })

    return NextResponse.json({ cities: result.rows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { country_code, names } = await request.json()

    if (!country_code || !names || !Array.isArray(names)) {
      return NextResponse.json({ error: 'country_code and names array are required' }, { status: 400 })
    }

    const timestamp = Date.now()
    const added: string[] = []

    for (let i = 0; i < names.length; i++) {
      const id = `${country_code.toLowerCase()}-${timestamp}-${i}`
      try {
        await turso.execute({
          sql: 'INSERT INTO cities (id, country_code, name) VALUES (?, ?, ?)',
          args: [id, country_code, names[i]]
        })
        added.push(id)
      } catch (e: any) {
        // Skip duplicates
        if (!e.message?.includes('UNIQUE constraint')) {
          console.error('City insert error:', e.message)
        }
      }
    }

    return NextResponse.json({ added, count: added.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
