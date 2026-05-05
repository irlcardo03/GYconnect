'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore, type Profile } from '@/lib/store'
import WelcomeScreen from '@/components/welcome'
import SetupFlow from '@/components/setup'
import AppShell from '@/components/app-shell'

export default function Home() {
  const { profile, setProfile, setPage, setIsDark, isAdminMode, setAdminMode, currentPage } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [banned, setBanned] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        // Init database
        await fetch('/api/init')

        // Detect Telegram WebApp
        const tg = (window as any).Telegram?.WebApp
        let telegramId: string

        if (tg) {
          tg.ready()
          tg.expand()
          telegramId = String(tg.initDataUnsafe?.user?.id || '')
          const isDarkTheme = tg.colorScheme === 'dark'
          setIsDark(isDarkTheme)
          if (isDarkTheme) {
            document.documentElement.classList.add('dark')
          }
        } else {
          // Browser mode - check localStorage for saved ID
          let demoId = localStorage.getItem('gyconnect_demo_id')
          if (!demoId) {
            demoId = 'demo_' + Math.random().toString(36).substring(2, 10)
            localStorage.setItem('gyconnect_demo_id', demoId)
          }
          telegramId = demoId
        }

        // Authenticate
        const authRes = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id: telegramId }),
        })

        if (authRes.ok) {
          const authData = await authRes.json()
          const p = authData.profile as Profile

          // Check if banned
          if (p.is_banned) {
            setBanned(true)
            setLoading(false)
            return
          }

          setProfile(p)

          // Check admin status
          const adminId = process.env.NEXT_PUBLIC_ADMIN_ID || '8262090447'
          if (p.telegram_id === adminId || p.is_admin === 1) {
            setAdminMode(true)
          }

          // If profile is incomplete (no first_name), show setup
          if (!p.first_name) {
            setPage('welcome')
          } else {
            setPage('discover')
          }
        }
      } catch (err) {
        console.error('Init error:', err)
        setPage('welcome')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [setProfile, setPage, setIsDark, setAdminMode])

  // Splash screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-extrabold text-white mb-4">GYconnect</h1>
          <div className="flex gap-1.5 justify-center">
            {[0, 0.15, 0.3].map((delay, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay }}
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: '#FF6B6B' }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // Banned screen
  if (banned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl text-red-500">!</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Suspended</h2>
          <p className="text-gray-400">Your account has been suspended due to community guideline violations.</p>
        </div>
      </div>
    )
  }

  // Welcome / Setup flow
  if (!profile?.first_name) {
    return (
      <AnimatePresence mode="wait">
        {currentPage === 'setup' ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="min-h-screen"
          >
            <SetupFlow />
          </motion.div>
        ) : (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="min-h-screen"
          >
            <WelcomeScreen />
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Main app
  return (
    <div className="min-h-screen bg-gray-950">
      <AppShell />
    </div>
  )
}
