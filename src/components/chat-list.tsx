'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Search, User } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface ChatItem {
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

export default function ChatList() {
  const { profile, setActiveChat, setPage, setAdminMode } = useAppStore()
  const [chats, setChats] = useState<ChatItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const ADMIN_ID = '8262090447'

  // Check if search matches admin ID
  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (value.trim() === ADMIN_ID) {
      setAdminMode(true)
      setPage('admin')
    }
  }

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
      setChats(data.chats || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChat = (chat: ChatItem) => {
    setActiveChat({
      id: String(chat.id),
      type: String(chat.type),
      name: chat.other_profile
        ? String(chat.other_profile.first_name || chat.other_profile.username)
        : String(chat.name || 'Group'),
      otherProfile: chat.other_profile as any,
      unreadCount: 0,
    })
    setPage('chat-detail')
  }

  const filteredChats = chats.filter((chat) => {
    if (!search) return true
    const name = chat.other_profile
      ? String(chat.other_profile.first_name || chat.other_profile.username)
      : String(chat.name || '')
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return 'now'
      if (diffMins < 60) return `${diffMins}m`
      const diffHrs = Math.floor(diffMins / 60)
      if (diffHrs < 24) return `${diffHrs}h`
      const diffDays = Math.floor(diffHrs / 24)
      if (diffDays < 7) return `${diffDays}d`
      return d.toLocaleDateString()
    } catch {
      return ''
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-bold text-white mb-4">Chats</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10 h-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 px-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8" style={{ color: '#FF6B6B' }} viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">
              {search ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredChats.map((chat, i) => {
              const name = chat.other_profile
                ? String(chat.other_profile.first_name || chat.other_profile.username)
                : String(chat.name || 'Group')
              const lastMsg = chat.last_message
                ? String(chat.last_message.content)
                : 'No messages yet'
              const time = chat.last_message
                ? formatTime(String(chat.last_message.created_at))
                : ''

              return (
                <motion.button
                  key={String(chat.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleOpenChat(chat)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white text-sm truncate">{name}</p>
                      {time && <span className="text-xs text-gray-500 shrink-0 ml-2">{time}</span>}
                    </div>
                    <p className="text-gray-400 text-xs truncate">{lastMsg}</p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
