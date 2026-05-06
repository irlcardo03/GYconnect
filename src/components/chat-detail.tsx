'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Send,
  Camera,
  Mic,
  MoreVertical,
  Flag,
  ShieldBan,
  Radio,
  Check,
  CheckCheck,
  Lock,
  Play,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAppStore, Message, Profile } from '@/lib/store'
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

function formatMessageTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDateSeparator(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / 86400000
  )
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function shouldShowDateSeparator(
  currentMsg: Message,
  prevMsg: Message | null
): boolean {
  if (!prevMsg) return true
  const currDay = new Date(currentMsg.createdAt).toDateString()
  const prevDay = new Date(prevMsg.createdAt).toDateString()
  return currDay !== prevDay
}

const ICEBREAKERS = [
  "What's your go-to song right now?",
  'If you could travel anywhere?',
  'Pineapple on pizza — yes or no?',
  'What makes you smile the most?',
]

export default function ChatDetail() {
  const {
    profile,
    activeChatId,
    activeChatProfile,
    messages,
    setMessages,
    addMessage,
    typingUsers,
    setTyping,
    setPage,
  } = useAppStore()

  const [inputText, setInputText] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [sending, setSending] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogContent, setDialogContent] = useState({ title: '', description: '' })
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set())
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const otherProfile = activeChatProfile as Profile | null
  const otherName = otherProfile?.first_name || 'Unknown'
  const otherPosition = otherProfile?.position || ''
  const isTyping = activeChatId ? typingUsers.get(activeChatId) || false : false
  const isSilverPlus =
    profile?.subscription_tier === 'silver' ||
    profile?.subscription_tier === 'gold'
  const isFree = profile?.subscription_tier === 'free'
  const hasNoMessages = messages.length === 0

  // Fetch messages on mount
  useEffect(() => {
    if (!activeChatId || !profile?.id) return

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `/api/messages?chat_id=${activeChatId}&profile_id=${profile.id}`
        )
        const data = await res.json()
        if (data.messages) {
          const msgs: Message[] = data.messages.map((m: any) => ({
            id: m.id,
            chatId: m.chat_id || activeChatId,
            senderId: m.sender_id,
            content: m.content,
            type: m.type || 'text',
            mediaId: m.media_id,
            isRead: Boolean(m.is_read),
            createdAt: m.created_at,
          }))
          setMessages(msgs)

          // Mark messages as read
          const unreadMsgIds = msgs
            .filter((m) => m.senderId !== profile.id && !m.isRead)
            .map((m) => m.id)
          if (unreadMsgIds.length > 0) {
            const socket = getSocket()
            socket.emit('mark-read', {
              chatId: activeChatId,
              recipientId: otherProfile?.id,
              messageIds: unreadMsgIds,
            })
          }
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err)
      }
    }

    fetchMessages()
  }, [activeChatId, profile?.id, otherProfile?.id, setMessages])

  // Socket.io events
  useEffect(() => {
    if (!profile?.id) return
    const socket = connectSocket(profile.id)

    const onNewMessage = (data: any) => {
      if (data.chatId === activeChatId) {
        const msg: Message = {
          id: data.id,
          chatId: data.chatId,
          senderId: data.senderId,
          content: data.content,
          type: data.type || 'text',
          mediaId: data.mediaId,
          isRead: false,
          createdAt: data.createdAt,
        }
        addMessage(msg)

        // Mark as read immediately since we're in the chat
        socket.emit('mark-read', {
          chatId: activeChatId,
          recipientId: otherProfile?.id,
          messageIds: [data.id],
        })
      }
    }

    const onUserTyping = (data: { chatId: string; senderId: string }) => {
      if (data.chatId === activeChatId && data.senderId !== profile.id) {
        setTyping(data.chatId, true)
      }
    }

    const onUserStopTyping = (data: { chatId: string; senderId: string }) => {
      if (data.chatId === activeChatId) {
        setTyping(data.chatId, false)
      }
    }

    const onMessagesRead = (data: { chatId: string; messageIds: string[] }) => {
      if (data.chatId === activeChatId) {
        setReadMessages((prev) => {
          const next = new Set(prev)
          data.messageIds.forEach((id) => next.add(id))
          return next
        })
      }
    }

    socket.on('new-message', onNewMessage)
    socket.on('user-typing', onUserTyping)
    socket.on('user-stop-typing', onUserStopTyping)
    socket.on('messages-read', onMessagesRead)

    return () => {
      socket.off('new-message', onNewMessage)
      socket.off('user-typing', onUserTyping)
      socket.off('user-stop-typing', onUserStopTyping)
      socket.off('messages-read', onMessagesRead)
    }
  }, [profile?.id, activeChatId, otherProfile?.id, addMessage, setTyping])

  // Check online status
  useEffect(() => {
    if (!otherProfile?.id) return
    const socket = getSocket()
    if (socket.connected) {
      socket.emit(
        'check-online',
        { profileIds: [otherProfile.id] },
        (result: Record<string, boolean>) => {
          setIsOnline(result[otherProfile.id!] || false)
        }
      )
    }

    const onOnline = (data: { profileId: string }) => {
      if (data.profileId === otherProfile.id) setIsOnline(true)
    }
    const onOffline = (data: { profileId: string }) => {
      if (data.profileId === otherProfile.id) setIsOnline(false)
    }

    socket.on('user-online', onOnline)
    socket.on('user-offline', onOffline)

    return () => {
      socket.off('user-online', onOnline)
      socket.off('user-offline', onOffline)
    }
  }, [otherProfile?.id])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollViewportRef.current) {
      requestAnimationFrame(() => {
        scrollViewportRef.current!.scrollTop = scrollViewportRef.current!.scrollHeight
      })
    }
  }, [messages, isTyping])

  // Handle typing events
  const handleInputChange = useCallback(
    (value: string) => {
      setInputText(value)
      if (!activeChatId || !profile?.id || !otherProfile?.id) return
      const socket = getSocket()

      if (value.length > 0) {
        socket.emit('typing', {
          chatId: activeChatId,
          senderId: profile.id,
          recipientId: otherProfile.id,
        })
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('stop-typing', {
            chatId: activeChatId,
            senderId: profile.id,
            recipientId: otherProfile.id,
          })
        }, 2000)
      } else {
        socket.emit('stop-typing', {
          chatId: activeChatId,
          senderId: profile.id,
          recipientId: otherProfile.id,
        })
      }
    },
    [activeChatId, profile?.id, otherProfile?.id]
  )

  // Send message
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !activeChatId || !profile?.id || !otherProfile?.id || sending)
      return

    const content = inputText.trim()
    setInputText('')
    setSending(true)

    // Stop typing
    const socket = getSocket()
    socket.emit('stop-typing', {
      chatId: activeChatId,
      senderId: profile.id,
      recipientId: otherProfile.id,
    })

    const messageId = crypto.randomUUID()
    const createdAt = new Date().toISOString()

    // Optimistic add
    const optimisticMsg: Message = {
      id: messageId,
      chatId: activeChatId,
      senderId: profile.id,
      content,
      type: 'text',
      isRead: false,
      createdAt,
    }
    addMessage(optimisticMsg)

    // Socket emit
    socket.emit('send-message', {
      chatId: activeChatId,
      senderId: profile.id,
      recipientId: otherProfile.id,
      content,
      type: 'text',
      messageId,
      createdAt,
    })

    // API persist
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: activeChatId,
          sender_id: profile.id,
          content,
          type: 'text',
        }),
      })
    } catch (err) {
      console.error('Failed to persist message:', err)
    }

    setSending(false)
    inputRef.current?.focus()
  }, [inputText, activeChatId, profile?.id, otherProfile?.id, sending, addMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const showInfoDialog = (title: string, desc: string) => {
    setDialogContent({ title, description: desc })
    setDialogOpen(true)
  }

  const handleIcebreaker = useCallback(
    (text: string) => {
      setInputText(text)
      inputRef.current?.focus()
    },
    []
  )

  return (
    <div className="flex flex-col h-screen bg-background safe-top">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-2 border-b border-border bg-background/95 backdrop-blur-sm z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setPage('chat')}
          className="size-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="size-5 text-foreground" />
        </motion.button>

        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={`size-9 rounded-full bg-gradient-to-br ${getGradient(
              otherName
            )} flex items-center justify-center text-white font-semibold text-sm`}
          >
            {otherName.charAt(0).toUpperCase()}
          </div>
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 border-2 border-background">
              <div className="absolute inset-0 rounded-full bg-emerald-500 pulse-ring" />
            </div>
          )}
        </div>

        {/* Name & badge */}
        <div className="flex-1 min-w-0 ml-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground truncate">
              {otherName}
            </span>
            {otherPosition && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4 rounded-full bg-teal/10 text-teal-dark dark:text-teal font-medium shrink-0"
              >
                {otherPosition}
              </Badge>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {isOnline ? 'Online' : 'Last seen recently'}
          </span>
        </div>

        {/* Menu */}
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-10 shrink-0">
              <MoreVertical className="size-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onClick={() =>
                showInfoDialog(
                  'Report User',
                  'This user has been reported. Our team will review within 24 hours.'
                )
              }
            >
              <Flag className="size-4 mr-2" />
              Report User
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                showInfoDialog(
                  'Block User',
                  'This user has been blocked. You will no longer receive messages from them.'
                )
              }
            >
              <ShieldBan className="size-4 mr-2" />
              Block User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                showInfoDialog(
                  'Support Channel',
                  'Join our support channel for help and community updates.'
                )
              }
            >
              <Radio className="size-4 mr-2" />
              Join Support Channel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div ref={scrollViewportRef} className="flex flex-col px-3 py-3 min-h-full">
          {messages.length === 0 && !isTyping && (
            <div className="flex-1 flex items-center justify-center py-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div
                  className={`size-16 rounded-full bg-gradient-to-br ${getGradient(
                    otherName
                  )} flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-lg`}
                >
                  {otherName.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Say hello to {otherName}!
                </p>
              </motion.div>
            </div>
          )}

          {messages.map((msg, i) => {
            const prevMsg = i > 0 ? messages[i - 1] : null
            const showDateSep = shouldShowDateSeparator(msg, prevMsg)
            const isMine = msg.senderId === profile?.id
            const isReadByOther = readMessages.has(msg.id) || msg.isRead

            return (
              <div key={msg.id}>
                {/* Date separator */}
                {showDateSep && (
                  <div className="flex items-center justify-center my-3">
                    <span className="text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}

                {/* Message bubble */}
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={`flex mb-1 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] ${
                      isMine ? 'chat-bubble-sent' : 'chat-bubble-received'
                    } px-3 py-2 shadow-sm`}
                  >
                    {/* Photo message */}
                    {msg.type === 'photo' && (
                      <div className="mb-1.5 relative rounded-xl overflow-hidden">
                        <div className="w-48 h-36 bg-white/10 flex items-center justify-center">
                          <ImageIcon className="size-8 text-white/60" />
                        </div>
                        <div className="absolute top-2 right-2 size-5 rounded-full bg-black/40 flex items-center justify-center">
                          <Lock className="size-3 text-white/80" />
                        </div>
                      </div>
                    )}

                    {/* Voice message */}
                    {msg.type === 'voice' && (
                      <div className="flex items-center gap-2 mb-1 min-w-[160px]">
                        <div className="size-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                          <Play className="size-3.5 text-white" />
                        </div>
                        <div className="flex-1 flex items-center gap-[2px]">
                          {Array.from({ length: 24 }).map((_, bar) => (
                            <div
                              key={bar}
                              className="w-[2px] rounded-full bg-white/50"
                              style={{
                                height: `${Math.random() * 16 + 4}px`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-white/70 shrink-0">
                          0:{(Math.floor(Math.random() * 50) + 10)
                            .toString()
                            .padStart(2, '0')}
                        </span>
                      </div>
                    )}

                    {/* Text content */}
                    {msg.type === 'text' && (
                      <p className="text-sm leading-relaxed break-words">
                        {msg.content}
                      </p>
                    )}

                    {/* Time + read receipt */}
                    <div
                      className={`flex items-center gap-1 mt-0.5 ${
                        isMine ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span className="text-[10px] text-white/60">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                      {isMine && isSilverPlus && (
                        isReadByOther ? (
                          <CheckCheck className="size-3 text-white/80" />
                        ) : (
                          <Check className="size-3 text-white/50" />
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )
          })}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex justify-start mb-1"
              >
                <div className="chat-bubble-received px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-white/70 mr-1">typing</span>
                    <span className="typing-dot size-1.5 rounded-full bg-white/70" />
                    <span className="typing-dot size-1.5 rounded-full bg-white/70" />
                    <span className="typing-dot size-1.5 rounded-full bg-white/70" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Icebreakers */}
      <AnimatePresence>
        {hasNoMessages && !isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-3 pb-2"
          >
            <div className="flex flex-wrap gap-2">
              {ICEBREAKERS.map((ib, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleIcebreaker(ib)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted/80 text-muted-foreground hover:bg-muted transition-colors border border-border/50"
                >
                  {ib}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="safe-bottom px-2 pb-2 pt-1 border-t border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          {/* Camera */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => showInfoDialog('Photos', 'Photo sharing coming soon!')}
            className="size-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
          >
            <Camera className="size-5 text-muted-foreground" />
          </motion.button>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-10 px-4 rounded-full bg-muted/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-coral/30 focus:border-coral/30 transition-all"
            />
          </div>

          {/* Mic */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (isFree) {
                showInfoDialog(
                  'Upgrade Required',
                  'Upgrade to Silver or Gold to send voice messages.'
                )
              } else {
                showInfoDialog('Voice Notes', 'Voice recording coming soon!')
              }
            }}
            className="size-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
          >
            <Mic
              className={`size-5 ${isFree ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}
            />
          </motion.button>

          {/* Send */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
              inputText.trim()
                ? 'bg-gradient-to-r from-coral to-[#FF8E6B] shadow-lg shadow-coral/20'
                : 'bg-muted/60'
            }`}
          >
            <Send
              className={`size-4.5 ${
                inputText.trim() ? 'text-white' : 'text-muted-foreground/50'
              }`}
            />
          </motion.button>
        </div>
      </div>

      {/* Info Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[300px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
