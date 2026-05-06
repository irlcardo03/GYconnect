'use client'

import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore, type Profile } from '@/lib/store'
import { connectSocket } from '@/lib/socket'
import WelcomeScreen from '@/components/welcome'
import SetupFlow from '@/components/setup'
import AppShell from '@/components/app-shell'

export default function Home() {
  const { profile, setProfile, setPage, setIsDark, currentPage, isAuthenticated } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [banned, setBanned] = useState(false)

  // Initialize app
  useEffect(() => {
    async function init() {
      try {
        // Init database
        await fetch('/api/init')

        // Detect Telegram WebApp
        const tg = (window as any).Telegram?.WebApp
        let telegramId: string

        if (tg) {
          // Running inside Telegram
          tg.ready()
          tg.expand()
          telegramId = String(tg.initDataUnsafe?.user?.id || '')

          // Apply Telegram theme
          const isDarkTheme = tg.colorScheme === 'dark'
          setIsDark(isDarkTheme)
          if (isDarkTheme) {
            document.documentElement.classList.add('dark')
          }
        } else {
          // Browser mode - generate demo ID
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

          // Check admin status
          const adminId = process.env.NEXT_PUBLIC_ADMIN_ID || '8262090447'
          if (p.telegram_id === adminId || telegramId === adminId) {
            p.is_admin = true
          }

          // Check if banned
          if (p.is_banned) {
            setBanned(true)
            setLoading(false)
            return
          }

          setProfile(p)

          // If profile is incomplete (no first_name), show setup
          if (!p.first_name) {
            setPage('welcome')
          } else {
            setPage('discover')
          }
        }
      } catch (err) {
        console.error('Init error:', err)
        // Fallback: show welcome
        setPage('welcome')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [setProfile, setPage, setIsDark])

  // Connect Socket.io via centralized module
  useEffect(() => {
    if (!profile?.id) return
    const socket = connectSocket(profile.id)
    return () => {
      socket.disconnect()
    }
  }, [profile?.id])

  // Splash screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-coral via-gold to-teal">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-extrabold text-white mb-2">GYconnect</h1>
          <div className="flex gap-1 justify-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              className="w-2 h-2 rounded-full bg-white"
            />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
              className="w-2 h-2 rounded-full bg-white"
            />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
              className="w-2 h-2 rounded-full bg-white"
            />
          </div>
        </motion.div>
      </div>
    )
  }

  // Banned screen
  if (banned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">&#x1F6AB;</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Account Suspended</h2>
          <p className="text-muted-foreground">Your account has been suspended due to community guideline violations.</p>
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
            className="min-h-screen bg-background"
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
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <AppShell />
    </div>
  )
}
