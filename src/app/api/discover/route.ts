import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profile_id = searchParams.get('profile_id')
    const country_code = searchParams.get('country_code')

    if (!profile_id || !country_code) {
      return NextResponse.json(
        { error: 'profile_id and country_code are required' },
        { status: 400 }
      )
    }

    // Get blocked user IDs
    const blocked = await turso.execute({
      sql: `SELECT blocked_id FROM blocks WHERE blocker_id = ?
            UNION
            SELECT blocker_id FROM blocks WHERE blocked_id = ?`,
      args: [profile_id, profile_id],
    })
    const blockedIds = blocked.rows.map((r: any) => r.blocked_id)

    // Get already liked/matched user IDs
    const liked = await turso.execute({
      sql: `SELECT to_id FROM matches WHERE from_id = ?`,
      args: [profile_id],
    })
    const likedIds = liked.rows.map((r: any) => r.to_id)

    // Build exclusion list
    const excludeIds = [profile_id, ...blockedIds, ...likedIds]

    // Get current user's vibes for matching
    const currentUser = await turso.execute({
      sql: 'SELECT vibes, city_id FROM profiles WHERE id = ?',
      args: [profile_id],
    })
    const currentVibes = currentUser.rows.length > 0 && currentUser.rows[0].vibes
      ? String(currentUser.rows[0].vibes).split(',').filter(Boolean)
      : []
    const currentCityId = currentUser.rows.length > 0 ? currentUser.rows[0].city_id : null

    // Fetch discoverable profiles
    let profiles: any[] = []

    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',')
      const result = await turso.execute({
        sql: `SELECT p.*, c.name as city_name, co.name as country_name, co.flag as country_flag
              FROM profiles p
              LEFT JOIN cities c ON p.city_id = c.id
              LEFT JOIN countries co ON p.country_code = co.code
              WHERE p.country_code = ?
              AND p.is_banned = 0
              AND p.id NOT IN (${placeholders})
              AND p.first_name != ''
              ORDER BY CASE WHEN p.city_id = ? THEN 0 ELSE 1 END, RANDOM()
              LIMIT 50`,
        args: [country_code, ...excludeIds, currentCityId || ''],
      })
      profiles = result.rows
    } else {
      const result = await turso.execute({
        sql: `SELECT p.*, c.name as city_name, co.name as country_name, co.flag as country_flag
              FROM profiles p
              LEFT JOIN cities c ON p.city_id = c.id
              LEFT JOIN countries co ON p.country_code = co.code
              WHERE p.country_code = ?
              AND p.is_banned = 0
              AND p.id != ?
              AND p.first_name != ''
              ORDER BY CASE WHEN p.city_id = ? THEN 0 ELSE 1 END, RANDOM()
              LIMIT 50`,
        args: [country_code, profile_id, currentCityId || ''],
      })
      profiles = result.rows
    }

    // Calculate vibe match scores
    const profilesScored = profiles.map((p: any) => {
      const profileVibes = p.vibes ? String(p.vibes).split(',').filter(Boolean) : []
      const commonVibes = currentVibes.filter((v: string) => profileVibes.includes(v))
      const vibeMatchScore = currentVibes.length > 0 && profileVibes.length > 0
        ? Math.round((commonVibes.length / Math.max(currentVibes.length, profileVibes.length)) * 100)
        : 0

      return {
        ...p,
        tags: p.tags ? String(p.tags).split(',').filter(Boolean) : [],
        vibes: profileVibes,
        vibe_match_score: vibeMatchScore,
      }
    })

    // Sort by: same city first, then by vibe match score, then random
    profilesScored.sort((a: any, b: any) => {
      const aSameCity = a.city_id === currentCityId ? 0 : 1
      const bSameCity = b.city_id === currentCityId ? 0 : 1
      if (aSameCity !== bSameCity) return aSameCity - bSameCity
      return b.vibe_match_score - a.vibe_match_score
    })

    return NextResponse.json({ profiles: profilesScored })
  } catch (error: any) {
    console.error('Discover error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch profiles' }, { status: 500 })
  }
}
