'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, Profile } from '@/lib/store'
import {
  Heart, Users, MessageCircle, Lock, Star, MapPin, Flame, Eye,
  Sparkles, ChevronRight, Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

/* ────────── Constants ────────── */

const POSITION_COLORS: Record<string, string> = {
  Top: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  Bottom: 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
  Versatile: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  Side: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
}

const POSITION_DOT: Record<string, string> = {
  Top: 'bg-blue-500',
  Bottom: 'bg-rose-500',
  Versatile: 'bg-purple-500',
  Side: 'bg-amber-500',
}

/* ────────── Avatar Initial ────────── */

function AvatarInitial({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-9 h-9 text-base', md: 'w-14 h-14 text-xl', lg: 'w-20 h-20 text-3xl' }
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold shadow-md
      bg-gradient-to-br from-coral via-pink-400 to-gold text-white shrink-0`}>
      {initial}
    </div>
  )
}

/* ────────── Vibe Match Mini ────────── */

function VibeMatchMini({ score }: { score: number | undefined }) {
  const pct = Math.min(100, Math.max(0, score || 0))
  if (pct === 0) return null
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-coral to-gold"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
      <span className="text-[10px] font-bold text-coral">{pct}%</span>
    </div>
  )
}

/* ────────── Match Card ────────── */

function MatchCard({
  match,
  onTap,
  index,
}: {
  match: any
  onTap: (match: any) => void
  index: number
}) {
  const vibeScore = match.vibe_match_score ?? match.vibeMatch ?? 0

  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onTap(match)}
      className="glass rounded-2xl border border-border/40 p-4 flex flex-col items-center gap-2
        shadow-md hover:shadow-lg transition-shadow w-full text-left"
    >
      {/* Avatar + Chat indicator */}
      <div className="relative">
        <AvatarInitial name={match.first_name || '?'} size="md" />
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full
          bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center shadow-sm">
          <MessageCircle className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Name + Age */}
      <div className="text-center w-full">
        <h3 className="text-sm font-bold truncate">
          {match.first_name}{match.age ? `, ${match.age}` : ''}
        </h3>
      </div>

      {/* Position badge */}
      {match.position && (
        <Badge
          variant="outline"
          className={`${POSITION_COLORS[match.position] || POSITION_COLORS.Versatile} gap-1 text-[10px] font-semibold px-2 py-0`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${POSITION_DOT[match.position] || POSITION_DOT.Versatile}`} />
          {match.position}
        </Badge>
      )}

      {/* City */}
      {match.city_name && (
        <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground truncate max-w-full">
          <MapPin className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">{match.city_name}</span>
        </div>
      )}

      {/* Vibe match */}
      <VibeMatchMini score={vibeScore} />
    </motion.button>
  )
}

/* ────────── Blurred Liked You Card ────────── */

function BlurredLikedCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative w-14 h-14 rounded-full overflow-hidden"
    >
      <div className="w-full h-full bg-gradient-to-br from-coral/40 to-gold/40 blur-md" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Lock className="w-5 h-5 text-white/70" />
      </div>
    </motion.div>
  )
}

/* ────────── Who Liked You Section ────────── */

function WhoLikedYouSection({
  tier,
  likedCount,
}: {
  tier: string
  likedCount: number
}) {
  const isPaid = tier === 'gold' || tier === 'diamond'
  const fakeCount = Math.max(likedCount, 3)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-coral" />
          <span className="text-sm font-semibold">Who Liked You</span>
        </div>
        {!isPaid && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-gold hover:text-gold-dark gap-1"
            onClick={() => toast.info('Upgrade to Gold to see who liked you!')}
          >
            <Star className="w-3 h-3" /> Upgrade
          </Button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {isPaid ? (
          // Paid: show real avatars (we don't have the data yet, so show placeholder)
          <div className="flex items-center gap-2 py-1 px-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-xs text-muted-foreground">Check your new likes in Discover</span>
          </div>
        ) : (
          // Free: show blurred avatars
          Array.from({ length: Math.min(fakeCount, 8) }).map((_, i) => (
            <BlurredLikedCard key={i} index={i} />
          ))
        )}
        {!isPaid && likedCount > 0 && (
          <div className="flex items-center justify-center min-w-[48px]">
            <span className="text-xs font-bold text-coral">+{likedCount}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   ═══════  MAIN MATCHES COMPONENT  ═══════
   ════════════════════════════════════════════ */

export default function MatchesPage() {
  const { profile, matches, setMatches, setPage, setActiveChat } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Fetch matches
  const fetchMatches = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      const res = await fetch(`/api/match?profile_id=${profile.id}`)
      const data = await res.json()
      if (data.matches) {
        const profileMatches: Profile[] = data.matches.map((m: any) => ({
          id: m.profile_id,
          telegram_id: '',
          first_name: m.first_name || 'Unknown',
          age: m.age || null,
          country_code: '',
          city_id: m.city_id || null,
          city_name: m.city_name || undefined,
          country_name: m.country_name || undefined,
          country_flag: m.country_flag || undefined,
          position: m.position || '',
          looking_for: m.looking_for || '',
          bio: m.bio || '',
          mood: m.mood || '',
          tags: m.tags || [],
          vibes: m.vibes || [],
          subscription_tier: m.subscription_tier || 'free',
          subscription_expires_at: null,
          profile_views: 0,
          streak: 0,
          is_banned: false,
          is_admin: false,
          daily_chats_used: 0,
          daily_likes_used: 0,
          daily_photos_sent: 0,
          daily_voice_sent: 0,
          daily_super_likes_used: 0,
          daily_boost_used: 0,
          daily_rewind_used: 0,
          daily_reset: '',
          created_at: '',
          last_active: '',
        }))
        setMatches(profileMatches)
      }
    } catch (err) {
      console.error('Fetch matches error:', err)
    } finally {
      setLoading(false)
    }
  }, [profile, setMatches])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  // Tap match → open chat
  const handleMatchTap = useCallback((match: any) => {
    const matchProfile: Profile = {
      id: match.profile_id,
      telegram_id: '',
      first_name: match.first_name || 'Unknown',
      age: match.age || null,
      country_code: '',
      city_id: match.city_id || null,
      city_name: match.city_name || undefined,
      country_name: match.country_name || undefined,
      country_flag: match.country_flag || undefined,
      position: match.position || '',
      looking_for: match.looking_for || '',
      bio: match.bio || '',
      mood: match.mood || '',
      tags: match.tags || [],
      vibes: match.vibes || [],
      subscription_tier: match.subscription_tier || 'free',
      subscription_expires_at: null,
      profile_views: 0,
      streak: 0,
      is_banned: false,
      is_admin: false,
      daily_chats_used: 0,
      daily_likes_used: 0,
      daily_photos_sent: 0,
      daily_voice_sent: 0,
      daily_super_likes_used: 0,
      daily_boost_used: 0,
      daily_rewind_used: 0,
      daily_reset: '',
      created_at: '',
      last_active: '',
    }
    setActiveChat(match.chat_id || null, matchProfile)
    setPage('chat-detail')
  }, [setActiveChat, setPage])

  // Filter by search
  const filteredMatches = matches.filter(m => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      m.first_name?.toLowerCase().includes(q) ||
      m.city_name?.toLowerCase().includes(q) ||
      m.position?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-2 pb-1">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold gradient-text">Matches</h1>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="w-3.5 h-3.5 text-coral" />
            <span>{matches.length} match{matches.length !== 1 ? 'es' : ''}</span>
          </div>
        </div>
      </div>

      {/* Who Liked You */}
      <div className="shrink-0 px-4 py-2">
        <WhoLikedYouSection
          tier={profile?.subscription_tier || 'free'}
          likedCount={0}
        />
      </div>

      {/* Search */}
      {matches.length > 0 && (
        <div className="shrink-0 px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search matches..."
              className="pl-9 h-10 rounded-xl bg-muted/50 border-transparent text-sm"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-10 h-10 border-3 border-coral border-t-transparent rounded-full"
            />
          </div>
        ) : matches.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-coral/20 to-gold/20 flex items-center justify-center">
              <Heart className="w-10 h-10 text-coral/60" />
            </div>
            <h3 className="text-xl font-bold">No matches yet</h3>
            <p className="text-sm text-muted-foreground max-w-[260px]">
              Start discovering people and make your first connection!
            </p>
            <Button
              onClick={() => setPage('discover')}
              className="rounded-xl h-12 px-6 bg-gradient-to-r from-coral to-pink-500 hover:opacity-90"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Start Discovering
            </Button>
          </motion.div>
        ) : filteredMatches.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
            <Search className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No matches found for &quot;{search}&quot;</p>
          </div>
        ) : (
          /* Matches Grid - 2 columns */
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredMatches.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onTap={handleMatchTap}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
