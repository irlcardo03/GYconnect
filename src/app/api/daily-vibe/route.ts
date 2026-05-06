import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

const VIBE_QUESTIONS = [
  "What's one thing that made you smile today? 😊",
  "If you could teleport anywhere right now, where would you go? 🌍",
  "What song is giving you life this week? 🎵",
  "What's your comfort show that you keep rewatching? 📺",
  "If you could have dinner with any person, alive or not, who would it be? 🍽️",
  "What's a small thing you're really grateful for today? 🙏",
  "What's your go-to karaoke song? 🎤",
  "If you had a superpower for a day, what would you do? 🦸",
  "What's the best advice you've ever received? 💡",
  "What's one thing you're looking forward to this week? ✨",
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profile_id = searchParams.get('profile_id')

    // Get today's question based on day of year (rotating)
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - startOfYear.getTime()
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    const questionIndex = dayOfYear % VIBE_QUESTIONS.length
    const todayQuestion = VIBE_QUESTIONS[questionIndex]

    let userAnswer = null

    if (profile_id) {
      // Check if user already answered today's question
      const todayStr = now.toISOString().split('T')[0]
      const existing = await turso.execute({
        sql: `SELECT * FROM daily_vibes
              WHERE profile_id = ? AND question = ? AND DATE(created_at) = ?`,
        args: [profile_id, todayQuestion, todayStr],
      })
      if (existing.rows.length > 0) {
        userAnswer = existing.rows[0]
      }
    }

    return NextResponse.json({
      question: todayQuestion,
      question_index: questionIndex,
      user_answer: userAnswer,
    })
  } catch (error: any) {
    console.error('Daily vibe error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch daily vibe' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profile_id, question, answer } = body

    if (!profile_id || !question || !answer) {
      return NextResponse.json(
        { error: 'profile_id, question, and answer are required' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const todayStr = new Date().toISOString().split('T')[0]

    // Check if already answered today
    const existing = await turso.execute({
      sql: `SELECT id FROM daily_vibes
            WHERE profile_id = ? AND DATE(created_at) = ?`,
      args: [profile_id, todayStr],
    })

    if (existing.rows.length > 0) {
      // Update existing answer
      await turso.execute({
        sql: 'UPDATE daily_vibes SET question = ?, answer = ? WHERE id = ?',
        args: [question, answer, existing.rows[0].id],
      })
      return NextResponse.json({ success: true, updated: true })
    }

    // Insert new answer
    await turso.execute({
      sql: `INSERT INTO daily_vibes (id, profile_id, question, answer, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [id, profile_id, question, answer, now],
    })

    // Update streak
    await turso.execute({
      sql: 'UPDATE profiles SET streak = streak + 1 WHERE id = ?',
      args: [profile_id],
    })

    return NextResponse.json({ success: true, vibe: { id, profile_id, question, answer } })
  } catch (error: any) {
    console.error('Submit vibe error:', error)
    return NextResponse.json({ error: error.message || 'Failed to submit vibe' }, { status: 500 })
  }
}
