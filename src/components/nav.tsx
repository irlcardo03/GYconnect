'use client'

import { Compass, Heart, Users, MessageCircle, User } from 'lucide-react'
import { useAppStore } from '@/lib/store'

const tabs = [
  { id: 'discover', icon: Compass, label: 'Discover' },
  { id: 'matches', icon: Heart, label: 'Matches' },
  { id: 'groups', icon: Users, label: 'Groups' },
  { id: 'chat', icon: MessageCircle, label: 'Chat' },
  { id: 'profile', icon: User, label: 'Profile' },
] as const

export default function Nav() {
  const { currentPage, setPage } = useAppStore()

  const activeTab = tabs.find(t => {
    if (t.id === 'chat') return currentPage === 'chat' || currentPage === 'chat-detail' || currentPage === 'chat-list'
    if (t.id === 'groups') return currentPage === 'groups' || currentPage === 'group-detail'
    if (t.id === 'profile') return currentPage === 'profile' || currentPage === 'subscription' || currentPage === 'payment' || currentPage === 'admin'
    if (t.id === 'matches') return currentPage === 'matches'
    return currentPage === t.id
  })?.id || 'discover'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-xl safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors"
              aria-label={label}
            >
              <Icon
                className="w-5 h-5 transition-colors"
                style={{ color: isActive ? '#FF6B6B' : '#6B7280' }}
                fill={isActive && id === 'matches' ? '#FF6B6B' : 'none'}
              />
              <span
                className="text-[10px] font-medium transition-colors"
                style={{ color: isActive ? '#FF6B6B' : '#6B7280' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
