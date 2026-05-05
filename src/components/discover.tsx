'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, Heart, Star, RefreshCw, MapPin, User } from 'lucide-react'
import { useAppStore, Profile } from '@/lib/store'

interface DiscoverProfile {
  profile: Profile
  distance?: string
}

export default function Discover() {
  const { profile, setPage } = useAppStore()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [matched, setMatched] = useState(false)
  const [matchName, setMatchName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchProfiles = useCallback(async () => {
    if (!profile?.id || !profile?.country_code) return
    setLoading(true)
    try {
      const res = await fetch(`/api/discover?profile_id=${profile.id}&country_code=${profile.country_code}`)
      const data = await res.json()
      setProfiles(data.profiles || [])
      setCurrentIndex(0)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.country_code])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const currentProfile = profiles[currentIndex]

  const handleAction = async (type: 'pass' | 'like' | 'superlike') => {
    if (!profile?.id || !currentProfile) return
    setActionLoading(true)

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_id: profile.id,
          to_id: String(currentProfile.id),
          type,
        }),
      })
      const data = await res.json()

      if (data.matched) {
        setMatchName(String(currentProfile.first_name || currentProfile.username || 'Someone'))
        setMatched(true)
        setTimeout(() => setMatched(false), 3000)
      }

      setCurrentIndex((prev) => prev + 1)
    } catch {
      // silently fail
    } finally {
      setActionLoading(false)
    }
  }

  // Swipe gesture
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8" style={{ color: '#FF6B6B' }} viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-400 text-sm">Finding people near you...</p>
        </div>
      </div>
    )
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
            <User className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white">No More Profiles</h3>
          <p className="text-gray-400 text-sm">Check back later for new people</p>
          <Button
            onClick={fetchProfiles}
            variant="outline"
            className="gap-2 border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 relative">
      {/* Match Popup */}
      <AnimatePresence>
        {matched && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4 text-center p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FF6B6B' }}
              >
                <Heart className="w-12 h-12 text-white" fill="white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white">It&apos;s a Match!</h2>
              <p className="text-gray-300">You and {matchName} liked each other</p>
              <Button
                onClick={() => { setMatched(false); setPage('chat-list') }}
                className="text-white rounded-xl px-8"
                style={{ backgroundColor: '#FF6B6B' }}
              >
                Send a Message
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Card */}
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl"
          >
            {/* Avatar Area */}
            <div className="h-64 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
              <User className="w-24 h-24 text-gray-600" />
              {/* Position Badge */}
              <div
                className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: '#2DD4BF' }}
              >
                {String(currentProfile.position || 'N/A')}
              </div>
            </div>

            {/* Info */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white">
                  {String(currentProfile.first_name || currentProfile.username || 'Anonymous')}
                </h3>
                <span className="text-gray-400 text-lg">{Number(currentProfile.age) || '?'}</span>
              </div>

              <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-3">
                <MapPin className="w-3.5 h-3.5" />
                <span>{String(currentProfile.city_id || 'Unknown location')}</span>
              </div>

              {currentProfile.bio && (
                <p className="text-gray-300 text-sm line-clamp-2">{String(currentProfile.bio)}</p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-5 mt-8">
        <button
          onClick={() => handleAction('pass')}
          disabled={actionLoading}
          className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors disabled:opacity-50"
          aria-label="Pass"
        >
          <X className="w-6 h-6 text-gray-300" />
        </button>

        <button
          onClick={() => handleAction('like')}
          disabled={actionLoading}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
          style={{ backgroundColor: '#FF6B6B' }}
          aria-label="Like"
        >
          <Heart className="w-7 h-7 text-white" fill="white" />
        </button>

        <button
          onClick={() => handleAction('superlike')}
          disabled={actionLoading}
          className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors disabled:opacity-50"
          aria-label="Super Like"
        >
          <Star className="w-6 h-6" style={{ color: '#F59E0B' }} fill="#F59E0B" />
        </button>
      </div>
    </div>
  )
}
