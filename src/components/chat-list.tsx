'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MessageCircle, Sparkles, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAppStore, ChatInfo, Profile } from '@/lib/store'
import { getSocket, connectSocket } from '@/lib/socket'

const AVATAR_GRADIENTS = [
  'from-rose-400 to-orange-400',
  'from-violet-400 to-purple-500',
  'from-teal-400 to-cyan-400',
  'from-amber-400 to-yellow-500',
  'from-pink-400 to-rose-500',
  'from-emerald-400 to-green-500',
  'from-blue-400 to-indigo-400',
  'from-fuchsia-400 to-pink-500',
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export default function ChatList() {
  const { profile, chats, setChats, setActiveChat, setPage } = useAppStore()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [onlineProfiles, setOnlineProfiles] = useState<Record<string, boolean>>({})
  const touchStartY = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchChats = useCallback(async () => {
    if (!profile?.id) return
    try {
      const res = await fetch(`/api/chat?profile_id=${profile.id}`)
      const data = await res.json()
      if (data.chats) {
        const chatInfos: ChatInfo[] = data.chats.map((c: any) => ({
          id: c.chat_id,
          otherProfile: c.other_user
            ? {
                id: c.other_user.id || c.other_profile_id,
                first_name: c.other_user.first_name || 'Unknown',
                position: c.other_user.position || '',
                subscription_tier: c.other_user.subscription_tier || 'free',
                country_flag: c.other_user.country_flag || '',
                country_name: c.other_user.country_name || '',
                city_name: c.other_user.city_name || '',
              } as Partial<Profile> as Profile
            : null,
          lastMessage: c.last_message?.content || '',
          lastMessageTime: c.last_message?.created_at || '',
          unreadCount: c.unread_count || 0,
          isOnline: false,
        }))
        setChats(chatInfos)

        // Check online status for all chat partners
        const socket = getSocket()
        if (socket.connected) {
          const profileIds = chatInfos
            .map((c) => c.otherProfile?.id)
            .filter(Boolean) as string[]
          if (profileIds.length > 0) {
            socket.emit('check-online', { profileIds }, (result: Record<string, boolean>) => {
              setOnlineProfiles(result)
            })
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [profile?.id, setChats])

  useEffect(() => {
    if (profile?.id) {
      connectSocket(profile.id)
    }
  }, [profile?.id])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  // Listen for online/offline events
  useEffect(() => {
    const socket = getSocket()
    const onOnline = (data: { profileId: string }) => {
      setOnlineProfiles((prev) => ({ ...prev, [data.profileId]: true }))
    }
    const onOffline = (data: { profileId: string }) => {
      setOnlineProfiles((prev) => ({ ...prev, [data.profileId]: false }))
    }

    socket.on('user-online', onOnline)
    socket.on('user-offline', onOffline)

    return () => {
      socket.off('user-online', onOnline)
      socket.off('user-offline', onOffline)
    }
  }, [])

  // Refresh chats when new message arrives
  useEffect(() => {
    const socket = getSocket()
    const onNewMessage = () => {
      fetchChats()
    }
    socket.on('new-message', onNewMessage)
    return () => {
      socket.off('new-message', onNewMessage)
    }
  }, [fetchChats])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchChats()
  }, [fetchChats])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = e.changedTouches[0].clientY - touchStartY.current
      const scrollTop = scrollRef.current?.scrollTop || 0
      if (diff > 80 && scrollTop <= 0 && !refreshing) {
        handleRefresh()
      }
    },
    [handleRefresh, refreshing]
  )

  const filteredChats = chats.filter((c) => {
    if (!search) return true
    const name = c.otherProfile?.first_name?.toLowerCase() || ''
    return name.includes(search.toLowerCase())
  })

  const handleChatTap = (chat: ChatInfo) => {
    setActiveChat(chat.id, chat.otherProfile)
    setPage('chat-detail')
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="safe-top px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            disabled={refreshing}
          >
            <RefreshCw
              className={`size-5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`}
            />
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-coral/30"
          />
        </div>
      </div>

      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-center text-sm text-muted-foreground"
          >
            <RefreshCw className="size-4 animate-spin mr-2" />
            Refreshing...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="size-10 rounded-full bg-muted shimmer" />
                <div className="flex-1">
                  <div className="h-4 w-24 rounded bg-muted shimmer mb-2" />
                  <div className="h-3 w-40 rounded bg-muted shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
          >
            <div className="size-20 rounded-full bg-muted/60 flex items-center justify-center mb-4">
              <MessageCircle className="size-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No conversations yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start meeting people and spark your first chat
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPage('discover')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-coral to-[#FF8E6B] text-white font-medium shadow-lg shadow-coral/20"
            >
              <Sparkles className="size-4" />
              Start discovering
            </motion.button>
          </motion.div>
        ) : (
          <div className="flex flex-col">
            {filteredChats.map((chat, index) => {
              const otherProfile = chat.otherProfile
              const name = otherProfile?.first_name || 'Unknown'
              const isOnline = otherProfile?.id
                ? onlineProfiles[otherProfile.id] || false
                : false
              const position = otherProfile?.position || ''

              return (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleChatTap(chat)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 active:bg-muted/60 cursor-pointer transition-colors min-h-[68px]"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`size-10 rounded-full bg-gradient-to-br ${getGradient(
                        name
                      )} flex items-center justify-center text-white font-semibold text-sm shadow-sm`}
                    >
                      {name.charAt(0).toUpperCase()}
                    </div>
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-emerald-500 border-2 border-background">
                        <div className="absolute inset-0 rounded-full bg-emerald-500 pulse-ring" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {name}
                      </span>
                      {position && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 rounded-full bg-teal/10 text-teal-dark dark:text-teal font-medium shrink-0"
                        >
                          {position}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate leading-relaxed">
                      {chat.lastMessage || 'No messages yet'}
                    </p>
                  </div>

                  {/* Right side: time + unread */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] text-muted-foreground">
                      {formatTimeAgo(chat.lastMessageTime)}
                    </span>
                    {chat.unreadCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-coral to-[#FF8E6B] flex items-center justify-center"
                      >
                        <span className="text-[10px] font-bold text-white">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
