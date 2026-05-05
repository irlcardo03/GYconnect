'use client'

import { motion } from 'framer-motion'
import { Search, MessageCircle, Users, User, Shield } from 'lucide-react'
import { useAppStore, type Page } from '@/lib/store'

interface NavItem {
  page: Page
  label: string
  icon: typeof Search
}

const NAV_ITEMS: NavItem[] = [
  { page: 'discover', label: 'Discover', icon: Search },
  { page: 'chat', label: 'Chat', icon: MessageCircle },
  { page: 'groups', label: 'Groups', icon: Users },
  { page: 'profile', label: 'Profile', icon: User },
  { page: 'admin', label: 'Admin', icon: Shield },
]

export default function BottomNav() {
  const { currentPage, setPage, profile, chats } = useAppStore()

  const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0)
  const isAdmin = profile?.is_admin ?? false

  const visibleItems = NAV_ITEMS.filter((item) => item.page !== 'admin' || isAdmin)

  // Map sub-pages to their nav parent
  const getActiveNavPage = (): Page => {
    if (currentPage === 'chat-detail') return 'chat'
    if (currentPage === 'group-detail') return 'groups'
    if (currentPage === 'settings' || currentPage === 'subscription' || currentPage === 'payment') return 'profile'
    if (currentPage === 'matches') return 'discover'
    return currentPage
  }

  const activeNavPage = getActiveNavPage()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      {/* Glassmorphism background */}
      <div className="glass border-t border-border/50">
        <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = activeNavPage === item.page
            const isChatTab = item.page === 'chat'

            return (
              <motion.button
                key={item.page}
                onClick={() => setPage(item.page)}
                className="relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[52px] min-h-[44px] rounded-xl transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #FF6B6B, #FFD93D)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-coral' : 'text-muted-foreground'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  {/* Unread badge for chat */}
                  {isChatTab && totalUnread > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-coral flex items-center justify-center"
                    >
                      <span className="text-[10px] font-bold text-white leading-none">
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] mt-0.5 font-medium transition-colors ${
                    isActive ? 'text-coral' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
