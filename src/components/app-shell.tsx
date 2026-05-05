'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import BottomNav from './nav'
import DiscoverPage from './discover'
import MatchesPage from './matches'
import ChatList from './chat-list'
import ChatDetail from './chat-detail'
import GroupsPage from './groups'
import GroupDetail from './group-detail'
import { ProfilePage } from './profile-page'
import { SubscriptionPage } from './subscription'
import { PaymentPage } from './payment'
import { AdminPage } from './admin'

// --- Header component ---
function PageHeader() {
  const { currentPage, previousPage, setPage, activeChatProfile } = useAppStore()

  const noHeaderPages = ['discover', 'chat-detail', 'group-detail']
  if (noHeaderPages.includes(currentPage)) return null

  const showBack = ['subscription', 'payment', 'matches', 'settings'].includes(currentPage)

  const getTitle = (): string => {
    switch (currentPage) {
      case 'chat': return 'Messages'
      case 'groups': return 'Groups'
      case 'profile': return 'My Profile'
      case 'admin': return 'Admin Panel'
      case 'settings': return 'Settings'
      case 'subscription': return 'Plans'
      case 'payment': return 'Payment'
      case 'matches': return 'Matches'
      default: return 'GYconnect'
    }
  }

  return (
    <header className="safe-top glass border-b border-border/50 sticky top-0 z-40">
      <div className="flex items-center h-12 px-4 max-w-lg mx-auto">
        {showBack && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setPage(previousPage || 'discover')}
            className="w-10 h-10 rounded-xl flex items-center justify-center -ml-2"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
        )}
        <h1 className="text-base font-bold text-foreground flex-1 text-center">
          {getTitle()}
        </h1>
        {showBack && <div className="w-10" />}
      </div>
    </header>
  )
}

// --- Page transition wrapper ---
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

// --- Main App Shell ---
export default function AppShell() {
  const { currentPage } = useAppStore()
  const showNav = !['chat-detail', 'group-detail'].includes(currentPage)

  const renderPage = () => {
    switch (currentPage) {
      case 'discover':
        return <DiscoverPage />
      case 'matches':
        return <MatchesPage />
      case 'chat':
        return <ChatList />
      case 'chat-detail':
        return <ChatDetail />
      case 'groups':
        return <GroupsPage />
      case 'group-detail':
        return <GroupDetail />
      case 'profile':
        return <ProfilePage />
      case 'subscription':
        return <SubscriptionPage />
      case 'payment':
        return <PaymentPage />
      case 'admin':
        return <AdminPage />
      default:
        return <DiscoverPage />
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />

      <main className={`flex-1 overflow-y-auto ${showNav ? 'pb-24' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="max-w-lg mx-auto"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {showNav && <BottomNav />}
    </div>
  )
}
