import { NextResponse } from 'next/server'
import turso from '@/lib/turso'

const VIBE_QUESTIONS = [
  { question: "What's one thing that made you smile today?", emoji: "😊" },
  { question: "If you could travel anywhere right now, where would you go?", emoji: "✈️" },
  { question: "What song has been stuck in your head lately?", emoji: "🎵" },
  { question: "What's your comfort food when you're feeling down?", emoji: "🍕" },
  { question: "Describe your perfect weekend in three words.", emoji: "🌟" },
  { question: "What's a small thing you're grateful for today?", emoji: "🙏" },
  { question: "If you could have dinner with anyone, who would it be?", emoji: "🍽️" },
  { question: "What hobby have you been curious about trying?", emoji: "🎨" },
  { question: "What's the best advice you've ever received?", emoji: "💡" },
  { question: "What's your go-to karaoke song?", emoji: "🎤" },
  { question: "If you could wake up with a new skill, what would it be?", emoji: "🧠" },
  { question: "What's the most beautiful place you've ever visited?", emoji: "🌅" },
  { question: "What's a movie you can watch over and over?", emoji: "🎬" },
  { question: "What's one thing you'd tell your younger self?", emoji: "💭" },
  { question: "What makes you feel most alive?", emoji: "🔥" },
  { question: "What's your favorite way to unwind after a long day?", emoji: "🛁" },
  { question: "If you could live in any decade, which would you choose?", emoji: "⏰" },
  { question: "What's the kindest thing someone has done for you?", emoji: "💝" },
  { question: "What's a dream you've never shared with anyone?", emoji: "🌙" },
  { question: "What's your hidden talent?", emoji: "🎭" },
  { question: "What's one thing you want to accomplish this year?", emoji: "🎯" },
  { question: "What's the funniest thing that happened to you recently?", emoji: "😂" },
  { question: "If you could change one thing about the world, what would it be?", emoji: "🌍" },
  { question: "What's your earliest happy memory?", emoji: "👶" },
  { question: "What book changed your perspective on something?", emoji: "📚" },
  { question: "What's your favorite thing about where you live?", emoji: "🏠" },
  { question: "What's a challenge you've overcome that you're proud of?", emoji: "🏆" },
  { question: "What's one thing you're looking forward to?", emoji: "✨" },
  { question: "If you could instantly learn any language, which would you pick?", emoji: "🗣️" },
  { question: "What's the most spontaneous thing you've ever done?", emoji: "🎲" },
]

export async function GET() {
  try {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - startOfYear.getTime()
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    const index = dayOfYear % VIBE_QUESTIONS.length

    return NextResponse.json({
      vibe: VIBE_QUESTIONS[index],
      day_of_year: dayOfYear
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { profile_id, question, answer } = await request.json()

    if (!profile_id || !question || !answer) {
      return NextResponse.json({ error: 'profile_id, question, and answer are required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await turso.execute({
      sql: 'INSERT INTO daily_vibes (id, profile_id, question, answer) VALUES (?, ?, ?, ?)',
      args: [id, profile_id, question, answer]
    })

    const result = await turso.execute({
      sql: 'SELECT * FROM daily_vibes WHERE id = ?',
      args: [id]
    })

    return NextResponse.json({ vibe: result.rows[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
