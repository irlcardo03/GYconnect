'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface GroupMessage {
  id: string
  group_id: string
  sender_id: string
  content: string
  created_at: string
  sender_name?: string
}

export default function GroupDetail() {
  const { profile, activeGroup, setPage } = useAppStore()
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeGroup) return
    fetchMessages()
  }, [activeGroup])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    if (!activeGroup) return
    setLoading(true)
    try {
      const res = await fetch(`/api/group-messages?group_id=${activeGroup}`)
      const data = await res.json()
      setMessages((data.messages || []).map((m: any) => ({
        id: String(m.id),
        group_id: String(m.group_id),
        sender_id: String(m.sender_id),
        content: String(m.content),
        created_at: String(m.created_at),
        sender_name: String(m.sender_name || m.sender_id || ''),
      })))
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !activeGroup || !profile?.id) return
    setSending(true)

    try {
      const res = await fetch('/api/group-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: activeGroup,
          sender_id: profile.id,
          content: newMessage.trim(),
        }),
      })
      const data = await res.json()

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: String(data.message.id),
            group_id: String(data.message.group_id),
            sender_id: String(data.message.sender_id),
            content: String(data.message.content),
            created_at: String(data.message.created_at),
            sender_name: String(profile.first_name || profile.username),
          },
        ])
        setNewMessage('')
      }
    } catch {
      // silently fail
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-10">
        <button
          onClick={() => setPage('groups')}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="font-semibold text-white text-sm">Group Chat</h2>
          <p className="text-gray-500 text-xs">Group conversation</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[calc(100vh-130px)]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8" style={{ color: '#FF6B6B' }} viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender_id === profile?.id
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[75%]">
                  {/* Sender name */}
                  {!isMine && (
                    <p className="text-xs text-gray-500 mb-1 ml-1">{msg.sender_name || 'Unknown'}</p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? 'rounded-br-md text-white'
                        : 'rounded-bl-md bg-gray-800 text-gray-100'
                    }`}
                    style={isMine ? { backgroundColor: '#FF6B6B' } : {}}
                  >
                    <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-500'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="px-4 py-3 border-t border-gray-800 bg-gray-900/80 backdrop-blur-xl sticky bottom-16">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="h-10 w-10 rounded-xl shrink-0"
            style={{ backgroundColor: '#FF6B6B' }}
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    </div>
  )
}
