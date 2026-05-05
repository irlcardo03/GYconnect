'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion'
import { useAppStore, DiscoverProfile } from '@/lib/store'
import {
  Heart, X, Zap, Filter, Flag, Eye, Flame, ChevronDown, ChevronUp,
  Send, CheckCircle2, MapPin, Quote, Sparkles, Coins, Star, Diamond,
  Users, RotateCcw, SlidersHorizontal, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

/* ────────── Constants & Mappings ────────── */

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

const VIBE_ICONS: Record<string, React.ReactNode> = {
  'Gym': <Flame className="w-3 h-3" />,
  'Travel': <MapPin className="w-3 h-3" />,
  'Music': <Sparkles className="w-3 h-3" />,
  'Movies': <Quote className="w-3 h-3" />,
  'Foodie': <Star className="w-3 h-3" />,
  'Gaming': <Zap className="w-3 h-3" />,
  'Art': <Sparkles className="w-3 h-3" />,
  'Dancing': <Sparkles className="w-3 h-3" />,
  'Cooking': <Star className="w-3 h-3" />,
  'Reading': <Quote className="w-3 h-3" />,
  'Beach': <MapPin className="w-3 h-3" />,
  'Hiking': <MapPin className="w-3 h-3" />,
  'Fashion': <Star className="w-3 h-3" />,
  'Tech': <Zap className="w-3 h-3" />,
  'Yoga': <Sparkles className="w-3 h-3" />,
  'Photography': <Eye className="w-3 h-3" />,
  'Nightlife': <Flame className="w-3 h-3" />,
  'Coffee': <Star className="w-3 h-3" />,
  'Pets': <Heart className="w-3 h-3" />,
  'Wine': <Star className="w-3 h-3" />,
}

const REPORT_REASONS = [
  'Harassment or bullying',
  'Spam or scam',
  'Inappropriate content',
  'Fake profile',
  'Underage user',
  'Hate speech',
  'Other',
]

const SWIPE_THRESHOLD = 120
const SUPER_LIKE_THRESHOLD = -150

/* ────────── Avatar Initial ────────── */

function AvatarInitial({ name, size = 'lg' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-10 h-10 text-lg', md: 'w-16 h-16 text-2xl', lg: 'w-24 h-24 text-4xl' }
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold shadow-lg
      bg-gradient-to-br from-coral via-pink-400 to-gold text-white`}>
      {initial}
    </div>
  )
}

/* ────────── Subscription Badge ────────── */

function SubscriptionBadge({ tier }: { tier: string }) {
  if (!tier || tier === 'free') return null
  const config: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    silver: { icon: <Coins className="w-3 h-3" />, label: 'Silver', cls: 'bg-gray-400/20 text-gray-500 border-gray-400/30' },
    gold: { icon: <Star className="w-3 h-3" />, label: 'Gold', cls: 'bg-yellow-400/20 text-yellow-600 border-yellow-400/30' },
    diamond: { icon: <Diamond className="w-3 h-3" />, label: 'Diamond', cls: 'bg-cyan-400/20 text-cyan-600 border-cyan-400/30' },
  }
  const c = config[tier.toLowerCase()] || config.silver
  return (
    <Badge variant="outline" className={`${c.cls} gap-1 text-[10px] font-semibold px-1.5 py-0`}>
      {c.icon} {c.label}
    </Badge>
  )
}

/* ────────── Vibe Match Meter ────────── */

function VibeMatchMeter({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score))
  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
        Vibe Match
      </span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-coral to-gold"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-bold text-coral whitespace-nowrap">{pct}%</span>
    </div>
  )
}

/* ────────── Daily Vibe Card ────────── */

function DailyVibeCard({ profileId }: { profileId: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const [question, setQuestion] = useState('')
  const [answered, setAnswered] = useState(false)
  const [answer, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!profileId) return
    fetch(`/api/daily-vibe?profile_id=${profileId}`)
      .then(r => r.json())
      .then(data => {
        if (data.question) setQuestion(data.question)
        if (data.user_answer) setAnswered(true)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [profileId])

  const handleSubmit = async () => {
    if (!answer.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/daily-vibe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId, question, answer: answer.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setAnswered(true)
        toast.success('Vibe submitted!')
      } else {
        toast.error(data.error || 'Failed to submit')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!loaded || !question) return null

  return (
    <motion.div
      layout
      className="glass rounded-2xl border border-border/50 overflow-hidden"
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-3 gap-2"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/20 to-coral/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-gold" />
          </div>
          <span className="text-sm font-semibold">Daily Vibe</span>
        </div>
        {answered && (
          <CheckCircle2 className="w-4 h-4 text-teal" />
        )}
        <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: collapsed ? 0 : 'auto', opacity: collapsed ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-3 pb-3 space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">{question}</p>
          {answered ? (
            <div className="flex items-center gap-2 text-teal text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Answered today&apos;s vibe!
            </div>
          ) : (
            <div className="flex gap-2">
              <Textarea
                value={answer}
                onChange={e => setAnswerText(e.target.value)}
                placeholder="Share your vibe..."
                className="min-h-[44px] resize-none text-sm bg-background/50"
                rows={2}
              />
              <Button
                onClick={handleSubmit}
                disabled={!answer.trim() || submitting}
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-coral to-pink-500 hover:opacity-90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ────────── Swipe Overlay ────────── */

function SwipeOverlay({ direction }: { direction: 'like' | 'pass' | 'super' | null }) {
  if (!direction) return null
  const configs = {
    like: { icon: <Heart className="w-20 h-20" />, color: 'text-coral', border: 'border-coral', rotate: -15 },
    pass: { icon: <X className="w-20 h-20" />, color: 'text-gray-400', border: 'border-gray-400', rotate: 15 },
    super: { icon: <Zap className="w-20 h-20" />, color: 'text-gold', border: 'border-gold', rotate: 0 },
  }
  const cfg = configs[direction]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className={`absolute inset-0 flex items-center justify-center z-30 pointer-events-none ${cfg.color}`}
    >
      <div className={`${cfg.border} border-4 rounded-3xl p-4 rotate-${cfg.rotate} bg-background/10 backdrop-blur-sm`}>
        {cfg.icon}
      </div>
    </motion.div>
  )
}

/* ────────── Profile Card ────────── */

function ProfileCard({
  profile,
  onAction,
  onReport,
  isTop,
}: {
  profile: DiscoverProfile
  onAction: (action: 'like' | 'pass' | 'super_like') => void
  onReport: (profile: DiscoverProfile) => void
  isTop: boolean
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18])
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])
  const superOpacity = useTransform(y, [SUPER_LIKE_THRESHOLD, 0], [1, 0])

  const [dragDirection, setDragDirection] = useState<'like' | 'pass' | 'super' | null>(null)
  const isDragging = useRef(false)

  const handleDragStart = () => {
    isDragging.current = true
  }

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD * 0.5) setDragDirection('like')
    else if (info.offset.x < -SWIPE_THRESHOLD * 0.5) setDragDirection('pass')
    else if (info.offset.y < SUPER_LIKE_THRESHOLD * 0.5) setDragDirection('super')
    else setDragDirection(null)
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDragging.current = false
    setDragDirection(null)

    if (info.offset.x > SWIPE_THRESHOLD) {
      onAction('like')
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onAction('pass')
    } else if (info.offset.y < SUPER_LIKE_THRESHOLD) {
      onAction('super_like')
    } else {
      // Snap back
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
      animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 })
    }
  }

  const vibeMatch = profile.vibeMatch ?? (profile as any).vibe_match_score ?? 0

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, y, rotate, zIndex: isTop ? 10 : 5 }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass rounded-3xl border border-border/40 shadow-xl shadow-black/5 dark:shadow-black/20
        h-full flex flex-col overflow-hidden relative">

        {/* Swipe overlay indicators */}
        {isTop && (
          <>
            <motion.div style={{ opacity: likeOpacity }} className="absolute top-6 right-6 z-20 pointer-events-none">
              <div className="border-4 border-coral rounded-2xl px-4 py-2 rotate-12">
                <span className="text-coral font-black text-2xl tracking-wider">LIKE</span>
              </div>
            </motion.div>
            <motion.div style={{ opacity: passOpacity }} className="absolute top-6 left-6 z-20 pointer-events-none">
              <div className="border-4 border-gray-400 rounded-2xl px-4 py-2 -rotate-12">
                <span className="text-gray-400 font-black text-2xl tracking-wider">NOPE</span>
              </div>
            </motion.div>
            <motion.div style={{ opacity: superOpacity }} className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="border-4 border-gold rounded-2xl px-4 py-2">
                <span className="text-gold font-black text-2xl tracking-wider">SUPER</span>
              </div>
            </motion.div>
          </>
        )}

        {/* Report button */}
        {isTop && (
          <button
            onClick={() => onReport(profile)}
            className="absolute top-3 left-3 z-20 w-9 h-9 rounded-full glass flex items-center justify-center
              hover:bg-destructive/10 transition-colors"
          >
            <Flag className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Card Content */}
        <ScrollArea className="flex-1 px-5 pt-6 pb-4">
          <div className="flex flex-col items-center gap-3">

            {/* Avatar */}
            <AvatarInitial name={profile.first_name} size="lg" />

            {/* Name & Age */}
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                {profile.first_name}{profile.age ? `, ${profile.age}` : ''}
              </h2>
            </div>

            {/* Location */}
            {(profile.city_name || profile.country_name) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>{[profile.city_name, profile.country_flag, profile.country_name].filter(Boolean).join(', ')}</span>
              </div>
            )}

            {/* Position + Looking For Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {profile.position && (
                <Badge variant="outline" className={`${POSITION_COLORS[profile.position] || POSITION_COLORS.Versatile} gap-1 text-xs font-semibold px-2.5 py-0.5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${POSITION_DOT[profile.position] || POSITION_DOT.Versatile}`} />
                  {profile.position}
                </Badge>
              )}
              {profile.looking_for && (
                <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted/50 gap-1 text-xs font-medium px-2.5 py-0.5">
                  <Users className="w-3 h-3" />
                  {profile.looking_for}
                </Badge>
              )}
              <SubscriptionBadge tier={profile.subscription_tier} />
            </div>

            {/* Vibes / Interests */}
            {profile.vibes && profile.vibes.length > 0 && (
              <div className="w-full overflow-x-auto pb-1 -mx-1">
                <div className="flex gap-1.5 px-1" style={{ minWidth: 'min-content' }}>
                  {profile.vibes.map((vibe, i) => (
                    <span
                      key={`${vibe}-${i}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                        bg-gradient-to-r from-coral/10 to-gold/10 border border-coral/20
                        text-xs font-medium whitespace-nowrap"
                    >
                      {VIBE_ICONS[vibe] || <Sparkles className="w-3 h-3" />}
                      {vibe}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center">
                {profile.tags.slice(0, 6).map((tag, i) => (
                  <span key={`${tag}-${i}`} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                    {tag}
                  </span>
                ))}
                {profile.tags.length > 6 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                    +{profile.tags.length - 6}
                  </span>
                )}
              </div>
            )}

            {/* Mood */}
            {profile.mood && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground w-full px-1">
                <Quote className="w-3.5 h-3.5 text-coral shrink-0" />
                <span className="italic truncate">{profile.mood}</span>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed text-center line-clamp-3 px-1">
                {profile.bio}
              </p>
            )}

            {/* Vibe Match */}
            <div className="w-full px-1">
              <VibeMatchMeter score={vibeMatch} />
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1 text-xs">
                <Eye className="w-3.5 h-3.5" />
                <span>{profile.profile_views || 0}</span>
              </div>
              {profile.streak > 0 && (
                <div className="flex items-center gap-1 text-xs text-coral">
                  <Flame className="w-3.5 h-3.5 fire-pulse" />
                  <span className="font-semibold">{profile.streak}</span>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  )
}

/* ────────── Filter Sheet ────────── */

interface FilterState {
  positions: string[]
  ageMin: number
  ageMax: number
  onlineOnly: boolean
}

function FilterSheet({
  open,
  onOpenChange,
  filters,
  onApply,
  onReset,
  activeCount,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: FilterState
  onApply: (f: FilterState) => void
  onReset: () => void
  activeCount: number
}) {
  const [local, setLocal] = useState<FilterState>(() => filters)

  // Use key-based reset via the Sheet component wrapper instead

  const positions = ['Top', 'Bottom', 'Versatile', 'Side']

  const togglePosition = (pos: string) => {
    setLocal(prev => ({
      ...prev,
      positions: prev.positions.includes(pos)
        ? prev.positions.filter(p => p !== pos)
        : [...prev.positions, pos],
    }))
  }

  const count = (() => {
    let c = 0
    if (local.positions.length > 0) c++
    if (local.ageMin !== 18 || local.ageMax !== 99) c++
    if (local.onlineOnly) c++
    return c
  })()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-coral" />
            Discover Filters
            {count > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-coral text-white text-xs flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Position */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Position</label>
            <div className="flex flex-wrap gap-2">
              {positions.map(pos => (
                <button
                  key={pos}
                  onClick={() => togglePosition(pos)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border
                    ${local.positions.includes(pos)
                      ? POSITION_COLORS[pos] + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-muted/50 text-muted-foreground border-transparent'
                    }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Age Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Age Range</label>
              <span className="text-sm text-muted-foreground">
                {local.ageMin} - {local.ageMax}
              </span>
            </div>
            <Slider
              min={18}
              max={99}
              step={1}
              value={[local.ageMin, local.ageMax]}
              onValueChange={([min, max]) => setLocal(prev => ({ ...prev, ageMin: min, ageMax: max }))}
              className="w-full"
            />
          </div>

          <Separator />

          {/* Online Now */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-semibold">Online Now</label>
              <p className="text-xs text-muted-foreground">Show only currently active profiles</p>
            </div>
            <Switch
              checked={local.onlineOnly}
              onCheckedChange={v => setLocal(prev => ({ ...prev, onlineOnly: v }))}
            />
          </div>
        </div>

        <SheetFooter className="flex-row gap-3 pt-2 pb-6">
          <Button
            variant="outline"
            onClick={() => {
              const reset: FilterState = { positions: [], ageMin: 18, ageMax: 99, onlineOnly: false }
              setLocal(reset)
              onReset()
            }}
            className="flex-1 rounded-xl h-12"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
          <Button
            onClick={() => { onApply(local); onOpenChange(false) }}
            className="flex-1 rounded-xl h-12 bg-gradient-to-r from-coral to-pink-500 hover:opacity-90"
          >
            Apply{count > 0 ? ` (${count})` : ''}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/* ────────── Report Dialog ────────── */

function ReportDialog({
  open,
  onOpenChange,
  profile,
  reporterId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: DiscoverProfile | null
  reporterId: string
}) {
  const [reason, setReason] = useState('')
  const [desc, setDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason || !profile || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_id: reporterId,
          reported_id: profile.id,
          reason,
          description: desc.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Report submitted. We will review it.')
        onOpenChange(false)
        setReason('')
        setDesc('')
      } else {
        toast.error(data.error || 'Failed to report')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive" />
            Report {profile?.first_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            {REPORT_REASONS.map(r => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border
                  ${reason === r
                    ? 'bg-destructive/10 border-destructive/30 text-destructive font-medium'
                    : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted'
                  }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Additional details (optional)"
            className="min-h-[60px] resize-none text-sm"
            rows={2}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            className="rounded-xl bg-destructive hover:bg-destructive/90"
          >
            {submitting ? 'Submitting...' : 'Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ────────── Match Celebration Modal ────────── */

function MatchCelebration({
  open,
  onClose,
  profile,
  onChat,
}: {
  open: boolean
  onClose: () => void
  profile: DiscoverProfile | null
  onChat: () => void
}) {
  if (!profile) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-[calc(100%-2rem)] sm:max-w-sm text-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-coral to-gold flex items-center justify-center">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold gradient-text">It&apos;s a Match!</h2>
          <p className="text-sm text-muted-foreground">
            You and <span className="font-semibold text-foreground">{profile.first_name}</span> liked each other
          </p>
          <AvatarInitial name={profile.first_name} size="md" />
          <div className="flex gap-3 w-full mt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12">
              Keep Swiping
            </Button>
            <Button
              onClick={onChat}
              className="flex-1 rounded-xl h-12 bg-gradient-to-r from-coral to-pink-500 hover:opacity-90"
            >
              Say Hi
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

/* ════════════════════════════════════════════
   ═══════  MAIN DISCOVER COMPONENT  ═══════
   ════════════════════════════════════════════ */

export default function DiscoverPage() {
  const { profile, discoverProfiles, currentDiscoverIndex,
    setDiscoverProfiles, nextDiscoverProfile, setPage, setActiveChat, updateProfile, setAdminTab } = useAppStore()

  const [loading, setLoading] = useState(true)
  const [adminSearch, setAdminSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportProfile, setReportProfile] = useState<DiscoverProfile | null>(null)
  const [matchOpen, setMatchOpen] = useState(false)
  const [matchedProfile, setMatchedProfile] = useState<DiscoverProfile | null>(null)
  const [actioning, setActioning] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | null>(null)

  const filters = useRef<FilterState>({ positions: [], ageMin: 18, ageMax: 99, onlineOnly: false })
  const [filterCount, setFilterCount] = useState(0)

  // Fetch profiles
  const fetchProfiles = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      const res = await fetch(`/api/discover?profile_id=${profile.id}&country_code=${profile.country_code}`)
      const data = await res.json()
      if (data.profiles) {
        // Apply client-side filters
        let filtered = data.profiles as DiscoverProfile[]
        const f = filters.current
        if (f.positions.length > 0) {
          filtered = filtered.filter(p => f.positions.includes(p.position))
        }
        if (f.ageMin > 18 || f.ageMax < 99) {
          filtered = filtered.filter(p => p.age !== null && p.age >= f.ageMin && p.age <= f.ageMax)
        }
        setDiscoverProfiles(filtered)
      }
    } catch (err) {
      console.error('Fetch discover error:', err)
    } finally {
      setLoading(false)
    }
  }, [profile, setDiscoverProfiles])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  // Current profile
  const currentProfile = discoverProfiles[currentDiscoverIndex] as DiscoverProfile | undefined
  const nextProfile = discoverProfiles[currentDiscoverIndex + 1] as DiscoverProfile | undefined
  const isEmpty = !loading && currentDiscoverIndex >= discoverProfiles.length

  // Handle action (like/pass/super_like)
  const handleAction = useCallback(async (action: 'like' | 'pass' | 'super_like') => {
    if (!currentProfile || !profile || actioning) return

    setActioning(true)
    setExitDirection(action === 'like' ? 'right' : action === 'pass' ? 'left' : 'up')

    try {
      if (action === 'like' || action === 'super_like') {
        const res = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from_id: profile.id,
            to_id: currentProfile.id,
            type: action === 'super_like' ? 'super_like' : 'like',
          }),
        })
        const data = await res.json()
        if (data.is_new_match) {
          setMatchedProfile(currentProfile)
          setTimeout(() => setMatchOpen(true), 400)
        }
      }
    } catch (err) {
      console.error('Action error:', err)
    }

    // Advance card after brief delay for animation
    setTimeout(() => {
      nextDiscoverProfile()
      setExitDirection(null)
      setActioning(false)
    }, 250)
  }, [currentProfile, profile, actioning, nextDiscoverProfile])

  // Handle match chat
  const handleMatchChat = useCallback(() => {
    if (matchedProfile) {
      setActiveChat(null, matchedProfile)
      setPage('chat-detail')
    }
    setMatchOpen(false)
  }, [matchedProfile, setActiveChat, setPage])

  // Report
  const handleReport = useCallback((p: DiscoverProfile) => {
    setReportProfile(p)
    setReportOpen(true)
  }, [])

  // Filter apply
  // Handle admin search - type admin Telegram ID to enter admin mode
  const handleAdminSearch = useCallback((value: string) => {
    setAdminSearch(value)
    if (value === '8262090447' && profile) {
      updateProfile({ is_admin: true })
      setAdminTab('dashboard')
      setPage('admin')
      setAdminSearch('')
      toast.success('Admin mode activated!')
    }
  }, [profile, updateProfile, setAdminTab, setPage])

  const handleFilterApply = useCallback((f: FilterState) => {
    filters.current = f
    let c = 0
    if (f.positions.length > 0) c++
    if (f.ageMin !== 18 || f.ageMax !== 99) c++
    if (f.onlineOnly) c++
    setFilterCount(c)
    fetchProfiles()
  }, [fetchProfiles])

  const handleFilterReset = useCallback(() => {
    filters.current = { positions: [], ageMin: 18, ageMax: 99, onlineOnly: false }
    setFilterCount(0)
    fetchProfiles()
  }, [fetchProfiles])

  /* ── RENDER ── */

  return (
    <div className="flex flex-col h-full relative">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-1 shrink-0">
        <h1 className="text-lg font-bold gradient-text">Discover</h1>
        <div className="flex-1 max-w-[180px]">
          <Input
            placeholder="Search..."
            value={adminSearch}
            onChange={(e) => handleAdminSearch(e.target.value)}
            className="h-8 text-xs rounded-full bg-muted/60 border-0"
          />
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFilterOpen(true)}
            className="w-10 h-10 rounded-xl"
          >
            <Filter className="w-5 h-5" />
          </Button>
          {filterCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-coral text-white text-[10px] flex items-center justify-center font-bold min-w-[18px] h-[18px]">
              {filterCount}
            </span>
          )}
        </div>
      </div>

      {/* Daily Vibe */}
      <div className="px-4 pb-2 shrink-0">
        {profile && <DailyVibeCard profileId={profile.id} />}
      </div>

      {/* Card stack area */}
      <div className="flex-1 px-4 pb-2 relative min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-10 h-10 border-3 border-coral border-t-transparent rounded-full"
            />
          </div>
        ) : isEmpty ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-coral/20 to-gold/20 flex items-center justify-center">
              <Users className="w-10 h-10 text-coral" />
            </div>
            <h3 className="text-xl font-bold">No more profiles</h3>
            <p className="text-sm text-muted-foreground max-w-[260px]">
              Be the first in your area! Invite friends to grow the community.
            </p>
            <Button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'GYconnect', text: 'Join me on GYconnect!', url: window.location.href })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                  toast.success('Link copied!')
                }
              }}
              className="rounded-xl h-12 px-6 bg-gradient-to-r from-coral to-pink-500 hover:opacity-90"
            >
              <Users className="w-4 h-4 mr-2" /> Invite Friends
            </Button>
          </motion.div>
        ) : (
          <div className="relative h-full w-full">
            {/* Next card (behind) */}
            {nextProfile && (
              <ProfileCard
                key={nextProfile.id + '-next'}
                profile={nextProfile}
                onAction={() => {}}
                onReport={() => {}}
                isTop={false}
              />
            )}
            {/* Current card (on top) */}
            {currentProfile && (
              <motion.div
                key={currentProfile.id}
                animate={
                  exitDirection === 'left' ? { x: -500, opacity: 0, rotate: -30 }
                  : exitDirection === 'right' ? { x: 500, opacity: 0, rotate: 30 }
                  : exitDirection === 'up' ? { y: -500, opacity: 0 }
                  : { x: 0, y: 0, opacity: 1, rotate: 0 }
                }
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <ProfileCard
                  profile={currentProfile}
                  onAction={handleAction}
                  onReport={handleReport}
                  isTop={true}
                />
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!loading && !isEmpty && currentProfile && (
        <div className="shrink-0 flex items-center justify-center gap-5 px-4 pb-4 pt-2 safe-bottom">
          {/* PASS */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleAction('pass')}
            className="w-14 h-14 rounded-full bg-muted/80 border-2 border-gray-300 dark:border-gray-600
              flex items-center justify-center shadow-lg active:shadow-md transition-shadow"
          >
            <X className="w-7 h-7 text-gray-500" />
          </motion.button>

          {/* LIKE (center, larger) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => handleAction('like')}
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-xl
              bg-gradient-to-br from-coral to-pink-500 active:shadow-lg transition-shadow"
          >
            <Heart className="w-9 h-9 text-white" />
          </motion.button>

          {/* SUPER LIKE (Gold+ only) */}
          {(profile?.subscription_tier === 'gold' || profile?.subscription_tier === 'diamond') ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleAction('super_like')}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg
                bg-gradient-to-br from-gold to-amber-400 active:shadow-md transition-shadow"
            >
              <Zap className="w-7 h-7 text-white" />
            </motion.button>
          ) : (
            <div className="w-14 h-14" /> // spacer
          )}
        </div>
      )}

      {/* Filter Sheet */}
      <FilterSheet
        key={filterOpen ? 'open' : 'closed'}
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters.current}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
        activeCount={filterCount}
      />

      {/* Report Dialog */}
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        profile={reportProfile}
        reporterId={profile?.id || ''}
      />

      {/* Match Celebration */}
      <MatchCelebration
        open={matchOpen}
        onClose={() => setMatchOpen(false)}
        profile={matchedProfile}
        onChat={handleMatchChat}
      />
    </div>
  )
}
