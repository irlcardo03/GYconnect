import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const result = await turso.execute({
      sql: `SELECT p.*, c.name as city_name, co.name as country_name, co.flag as country_flag
            FROM profiles p
            LEFT JOIN cities c ON p.city_id = c.id
            LEFT JOIN countries co ON p.country_code = co.code
            WHERE p.id = ?`,
      args: [id],
    })

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const profile = result.rows[0]
    return NextResponse.json({
      profile: {
        ...profile,
        tags: profile.tags ? String(profile.tags).split(',').filter(Boolean) : [],
        vibes: profile.vibes ? String(profile.vibes).split(',').filter(Boolean) : [],
      },
    })
  } catch (error: any) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      first_name,
      age,
      country_code,
      city_id,
      position,
      looking_for,
      bio,
      mood,
      tags,
      vibes,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // Build dynamic update query
    const updates: string[] = ['updated_at = ?', 'last_active = ?']
    const args: any[] = [now, now]

    if (first_name !== undefined) {
      updates.push('first_name = ?')
      args.push(String(first_name))
    }
    if (age !== undefined) {
      updates.push('age = ?')
      args.push(Number(age))
    }
    if (country_code !== undefined) {
      updates.push('country_code = ?')
      args.push(String(country_code))
    }
    if (city_id !== undefined) {
      updates.push('city_id = ?')
      args.push(String(city_id))
    }
    if (position !== undefined) {
      updates.push('position = ?')
      args.push(String(position))
    }
    if (looking_for !== undefined) {
      updates.push('looking_for = ?')
      args.push(String(looking_for))
    }
    if (bio !== undefined) {
      updates.push('bio = ?')
      args.push(String(bio))
    }
    if (mood !== undefined) {
      updates.push('mood = ?')
      args.push(String(mood))
    }
    if (tags !== undefined) {
      updates.push('tags = ?')
      args.push(String(tags))
    }
    if (vibes !== undefined) {
      updates.push('vibes = ?')
      args.push(String(vibes))
    }

    args.push(id)

    await turso.execute({
      sql: `UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`,
      args,
    })

    // Check if report_count >= 5 and auto-ban
    const profileCheck = await turso.execute({
      sql: 'SELECT report_count FROM profiles WHERE id = ?',
      args: [id],
    })

    if (profileCheck.rows.length > 0 && Number(profileCheck.rows[0].report_count) >= 5) {
      await turso.execute({
        sql: 'UPDATE profiles SET is_banned = 1 WHERE id = ?',
        args: [id],
      })
    }

    // Fetch updated profile with joins
    const result = await turso.execute({
      sql: `SELECT p.*, c.name as city_name, co.name as country_name, co.flag as country_flag
            FROM profiles p
            LEFT JOIN cities c ON p.city_id = c.id
            LEFT JOIN countries co ON p.country_code = co.code
            WHERE p.id = ?`,
      args: [id],
    })

    const profile = result.rows[0]
    return NextResponse.json({
      profile: {
        ...profile,
        tags: profile.tags ? String(profile.tags).split(',').filter(Boolean) : [],
        vibes: profile.vibes ? String(profile.vibes).split(',').filter(Boolean) : [],
      },
    })
  } catch (error: any) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 })
  }
}
