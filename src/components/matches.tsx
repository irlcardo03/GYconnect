'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, User } from 'lucide-react'
import { useAppStore, Profile } from '@/lib/store'

interface ChatData {
  id: string
  type: string
  name: string
  other_profile?: {
    id: string
    username: string
    first_name: string
    mood: string
    subscription_tier: string
  }
  last_message?: {
    content: string
    created_at: string
  }
}

export default function Matches() {
  const { profile, setActiveChat, setPage } = useAppStore()
  const [chats, setChats] = useState<ChatData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    fetchChats()
  }, [profile?.id])

  const fetchChats = async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/chat?profile_id=${profile.id}`)
      const data = await res.json()
      // Filter to direct chats only (mutual matches)
      const directChats = (data.chats || []).filter((c: ChatData) => String(c.type) === 'direct')
      setChats(directChats)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChat = (chat: ChatData) => {
    setActiveChat({
      id: String(chat.id),
      type: String(chat.type),
      name: chat.other_profile ? String(chat.other_profile.first_name || chat.other_profile.username) : 'Unknown',
      otherProfile: chat.other_profile as any,
      unreadCount: 0,
    })
    setPage('chat-detail')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-8 w-8" style={{ color: '#FF6B6B' }} viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
            <Heart className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white">No Matches Yet</h3>
          <p className="text-gray-400 text-sm">Keep swiping to find your match</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 pt-6">
      <h1 className="text-2xl font-bold text-white mb-6 px-2">Matches</h1>

      {/* New Matches Row */}
      <div className="mb-6">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {chats.map((chat, i) => (
            <motion.button
              key={String(chat.id)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleOpenChat(chat)}
              className="flex flex-col items-center gap-2 shrink-0"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                style={{ borderColor: '#FF6B6B' }}
              >
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <span className="text-xs text-gray-300 max-w-[64px] truncate">
                {chat.other_profile ? String(chat.other_profile.first_name || chat.other_profile.username) : '???'}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="space-y-1">
        {chats.map((chat, i) => (
          <motion.button
            key={String(chat.id)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleOpenChat(chat)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-white text-sm">
                {chat.other_profile ? String(chat.other_profile.first_name || chat.other_profile.username) : 'Unknown'}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {chat.last_message ? String(chat.last_message.content) : 'Start a conversation!'}
              </p>
            </div>
            <MessageCircle className="w-4 h-4 text-gray-500 shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  )
}
