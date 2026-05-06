'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useAppStore } from '@/lib/store'

// Floating bubble component
function FloatingBubble({ delay, size, x, color }: { delay: number; size: number; x: string; color: string }) {
  return (
    <motion.div
      className="absolute rounded-full opacity-20"
      style={{
        width: size,
        height: size,
        left: x,
        background: color,
        filter: 'blur(1px)',
      }}
      initial={{ y: '100vh', scale: 0 }}
      animate={{
        y: '-20vh',
        scale: [0, 1, 0.8],
        opacity: [0, 0.2, 0],
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  )
}

export default function WelcomeScreen() {
  const setPage = useAppStore((s) => s.setPage)

  const bubbles = [
    { delay: 0, size: 60, x: '10%', color: '#FF6B6B' },
    { delay: 1.5, size: 80, x: '75%', color: '#FFD93D' },
    { delay: 3, size: 50, x: '50%', color: '#2DD4BF' },
    { delay: 4.5, size: 70, x: '25%', color: '#FF6B6B' },
    { delay: 2, size: 45, x: '85%', color: '#2DD4BF' },
    { delay: 5, size: 90, x: '40%', color: '#FFD93D' },
    { delay: 6, size: 55, x: '65%', color: '#FF6B6B' },
    { delay: 0.5, size: 40, x: '5%', color: '#2DD4BF' },
  ]

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 25%, #FFD93D 50%, #2DD4BF 75%, #14B8A6 100%)',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />

      {/* Floating bubbles */}
      {bubbles.map((bubble, i) => (
        <FloatingBubble key={i} {...bubble} />
      ))}

      {/* Decorative circles */}
      <motion.div
        className="absolute top-20 -left-20 w-64 h-64 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #FFD93D, transparent)' }}
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-32 -right-16 w-48 h-48 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #2DD4BF, transparent)' }}
        animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-8">
        {/* Logo icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        {/* App name */}
        <motion.h1
          className="text-5xl font-extrabold tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
        >
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #FFF8F0 40%, #FFD93D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            GYconnect
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="mt-3 text-lg text-white/80 font-medium tracking-wide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          Connect. Chat. Vibe.
        </motion.p>

        {/* Animated underline */}
        <motion.div
          className="mt-2 h-0.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #FFD93D, transparent)' }}
          initial={{ width: 0 }}
          animate={{ width: 140 }}
          transition={{ delay: 1.2, duration: 0.8, ease: 'easeOut' }}
        />

        {/* Get Started button */}
        <motion.button
          className="mt-12 px-10 py-4 rounded-2xl text-white font-bold text-lg shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #FF6B6B, #FF8E6B)',
            boxShadow: '0 8px 32px rgba(255, 107, 107, 0.4)',
          }}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.6, ease: 'easeOut' }}
          whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(255, 107, 107, 0.5)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setPage('setup')}
        >
          Get Started
        </motion.button>

        {/* Community text */}
        <motion.p
          className="mt-8 text-white/50 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          Join the community
        </motion.p>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  )
}
