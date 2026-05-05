'use client'

import { useAppStore } from '@/lib/store'
import Nav from '@/components/nav'
import Discover from '@/components/discover'
import Matches from '@/components/matches'
import Groups from '@/components/groups'
import ChatList from '@/components/chat-list'
import ChatDetail from '@/components/chat-detail'
import GroupDetail from '@/components/group-detail'
import ProfilePage from '@/components/profile-page'
import Subscription from '@/components/subscription'
import Payment from '@/components/payment'
import Admin from '@/components/admin'

export default function AppShell() {
  const { currentPage } = useAppStore()

  const renderPage = () => {
    switch (currentPage) {
      case 'discover':
        return <Discover />
      case 'matches':
        return <Matches />
      case 'groups':
        return <Groups />
      case 'group-detail':
        return <GroupDetail />
      case 'chat':
      case 'chat-list':
        return <ChatList />
      case 'chat-detail':
        return <ChatDetail />
      case 'profile':
        return <ProfilePage />
      case 'subscription':
        return <Subscription />
      case 'payment':
        return <Payment />
      case 'admin':
        return <Admin />
      default:
        return <Discover />
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="pb-16">
        {renderPage()}
      </main>
      <Nav />
    </div>
  )
}
