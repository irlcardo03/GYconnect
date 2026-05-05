'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function Welcome() {
  const { setPage, setSetupStep } = useAppStore()

  const handleGetStarted = () => {
    setSetupStep(1)
    setPage('setup')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex flex-col items-center text-center gap-6"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: '#FF6B6B' }}
        >
          <Heart className="w-10 h-10 text-white" fill="white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-5xl font-bold text-white tracking-tight"
        >
          GYconnect
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-gray-300 text-lg max-w-xs"
        >
          Privacy-First LGBTQ+ Community
        </motion.p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="text-gray-400 text-sm tracking-widest uppercase"
        >
          Connect. Chat. Vibe.
        </motion.p>

        {/* Get Started Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-8 w-full max-w-xs"
        >
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="w-full h-12 text-base font-semibold text-white rounded-xl"
            style={{ backgroundColor: '#FF6B6B' }}
          >
            Get Started
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
