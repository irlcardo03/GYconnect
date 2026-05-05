'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Send,
  Users,
  Info,
  Camera,
  Mic,
  Check,
  CheckCheck,
  Play,
  Image as ImageIcon,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAppStore, Message, GroupInfo } from '@/lib/store'
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
  return d.toLocaleTimeString('en', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
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

// Group sender names for display (since all messages are left-side with sender names)
const senderNames: Record<string, string> = {}

export default function GroupDetail() {
  const {
    profile,
    activeGroupId,
    groupMessages,
    setGroupMessages,
    addGroupMessage,
    groups,
    setPage,
  } = useAppStore()

  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogContent, setDialogContent] = useState({ title: '', description: '' })
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const activeGroup = groups.find((g) => g.id === activeGroupId) as
    | GroupInfo
    | undefined
  const groupName = activeGroup?.name || 'Group'
  const groupDesc = activeGroup?.description || ''
  const memberCount = activeGroup?.member_count || 0
  const isFree = profile?.subscription_tier === 'free'

  // Fetch group messages on mount
  useEffect(() => {
    if (!activeGroupId) return

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `/api/group-messages?group_id=${activeGroupId}`
        )
        const data = await res.json()
        if (data.messages) {
          const msgs: Message[] = data.messages.map((m: any) => ({
            id: m.id,
            chatId: activeGroupId,
            senderId: m.sender_id,
            content: m.content,
            type: m.type || 'text',
            mediaId: undefined,
            isRead: true,
            createdAt: m.created_at,
          }))
          setGroupMessages(msgs)

          // Build sender name map
          msgs.forEach((m) => {
            if (!senderNames[m.senderId]) {
              senderNames[m.senderId] = m.senderId === profile?.id
                ? profile.first_name
                : (data.messages.find((dm: any) => dm.sender_id === m.senderId)?.sender_name || `User ${m.senderId.slice(0, 4)}`)
            }
          })
        }
      } catch (err) {
        console.error('Failed to fetch group messages:', err)
      }
    }

    fetchMessages()
  }, [activeGroupId, profile?.id, setGroupMessages])

  // Socket.io: join group room & listen for messages
  useEffect(() => {
    if (!profile?.id || !activeGroupId) return
    const socket = connectSocket(profile.id)

    // Join group room
    socket.emit('join-group', { groupId: activeGroupId })

    const onNewGroupMessage = (data: any) => {
      if (data.groupId === activeGroupId) {
        const msg: Message = {
          id: data.id,
          chatId: activeGroupId,
          senderId: data.senderId,
          content: data.content,
          type: data.type || 'text',
          isRead: false,
          createdAt: data.createdAt,
        }
        addGroupMessage(msg)
      }
    }

    socket.on('new-group-message', onNewGroupMessage)

    return () => {
      socket.off('new-group-message', onNewGroupMessage)
      socket.emit('leave-group', { groupId: activeGroupId })
    }
  }, [profile?.id, activeGroupId, addGroupMessage])

  // Auto-scroll
  useEffect(() => {
    if (scrollViewportRef.current) {
      requestAnimationFrame(() => {
        scrollViewportRef.current!.scrollTop = scrollViewportRef.current!.scrollHeight
      })
    }
  }, [groupMessages])

  // Send group message
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !activeGroupId || !profile?.id || sending) return

    const content = inputText.trim()
    setInputText('')
    setSending(true)

    const messageId = crypto.randomUUID()
    const createdAt = new Date().toISOString()

    // Optimistic add
    const optimisticMsg: Message = {
      id: messageId,
      chatId: activeGroupId,
      senderId: profile.id,
      content,
      type: 'text',
      isRead: false,
      createdAt,
    }
    addGroupMessage(optimisticMsg)

    // Socket emit
    const socket = getSocket()
    socket.emit('send-group-message', {
      groupId: activeGroupId,
      senderId: profile.id,
      content,
      type: 'text',
      messageId,
      createdAt,
    })

    // API persist
    try {
      await fetch('/api/group-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: activeGroupId,
          sender_id: profile.id,
          content,
          type: 'text',
        }),
      })
    } catch (err) {
      console.error('Failed to persist group message:', err)
    }

    setSending(false)
    inputRef.current?.focus()
  }, [inputText, activeGroupId, profile?.id, sending, addGroupMessage])

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

  // Get sender display name
  const getSenderName = (senderId: string): string => {
    if (senderId === profile?.id) return profile.first_name || 'You'
    return senderNames[senderId] || `User ${senderId.slice(0, 4)}`
  }

  return (
    <div className="flex flex-col h-screen bg-background safe-top">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-2 border-b border-border bg-background/95 backdrop-blur-sm z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setPage('groups')}
          className="size-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="size-5 text-foreground" />
        </motion.button>

        {/* Group avatar */}
        <div className="size-9 rounded-xl bg-gradient-to-br from-coral/80 to-[#FF8E6B]/80 flex items-center justify-center text-white shrink-0">
          <Users className="size-4.5" />
        </div>

        {/* Group name & info */}
        <div className="flex-1 min-w-0 ml-1">
          <span className="font-semibold text-sm text-foreground truncate block">
            {groupName}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Info button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setInfoOpen(true)}
          className="size-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
        >
          <Info className="size-5 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div ref={scrollViewportRef} className="flex flex-col px-3 py-3 min-h-full">
          {groupMessages.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="size-16 rounded-2xl bg-gradient-to-br from-coral/80 to-[#FF8E6B]/80 flex items-center justify-center text-white mx-auto mb-3 shadow-lg">
                  <Users className="size-8" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{groupName}</h3>
                <p className="text-sm text-muted-foreground max-w-[240px]">
                  {groupDesc || 'Be the first to say something!'}
                </p>
              </motion.div>
            </div>
          )}

          {groupMessages.map((msg, i) => {
            const prevMsg = i > 0 ? groupMessages[i - 1] : null
            const showDateSep = shouldShowDateSeparator(msg, prevMsg)
            const isMine = msg.senderId === profile?.id
            const senderName = getSenderName(msg.senderId)
            // Show sender name if different from previous sender
            const showSenderName =
              !prevMsg || prevMsg.senderId !== msg.senderId || showDateSep

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

                {/* Message bubble - all on left side for groups */}
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="flex justify-start mb-1"
                >
                  {/* Sender avatar (small) */}
                  {showSenderName && (
                    <div
                      className={`size-7 rounded-full bg-gradient-to-br ${getGradient(
                        senderName
                      )} flex items-center justify-center text-white font-semibold text-[10px] shrink-0 mt-1 mr-2`}
                    >
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {!showSenderName && <div className="w-7 mr-2 shrink-0" />}

                  <div className="max-w-[80%]">
                    {/* Sender name */}
                    {showSenderName && (
                      <span
                        className={`text-[11px] font-medium ${
                          isMine ? 'text-coral' : 'text-teal'
                        } mb-0.5 block`}
                      >
                        {senderName}
                      </span>
                    )}

                    <div className="chat-bubble-received px-3 py-2 shadow-sm">
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
                            0:
                            {(Math.floor(Math.random() * 50) + 10)
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

                      {/* Time */}
                      <div className="flex items-center justify-end mt-0.5 gap-1">
                        <span className="text-[10px] text-white/60">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                        {isMine && (
                          msg.isRead ? (
                            <CheckCheck className="size-3 text-white/80" />
                          ) : (
                            <Check className="size-3 text-white/50" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

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
              placeholder="Message the group..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
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

      {/* Group Info Sheet */}
      <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
        <SheetContent side="right" className="w-[300px]">
          <SheetHeader className="mt-4">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-coral/80 to-[#FF8E6B]/80 flex items-center justify-center text-white mx-auto mb-2 shadow-lg">
              <Users className="size-8" />
            </div>
            <SheetTitle className="text-center">{groupName}</SheetTitle>
            <SheetDescription className="text-center">
              {groupDesc || 'Community group'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-muted-foreground">Members</span>
              <div className="flex items-center gap-1.5">
                <Users className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">{memberCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-muted-foreground">Group ID</span>
              <span className="text-xs text-muted-foreground font-mono">
                {activeGroupId?.slice(0, 8)}...
              </span>
            </div>

            <div className="h-px bg-border" />

            <p className="text-xs text-muted-foreground px-2 text-center">
              Group messages are visible to all members. Be respectful and follow community guidelines.
            </p>
          </div>
        </SheetContent>
      </Sheet>

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
