'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Music, Dumbbell, Utensils, Film, BookOpen, Gamepad2,
  PartyPopper, Trees, Plane, Camera, ChefHat, Shirt,
  Heart, Palette, Cpu, Flower2,
  ChevronLeft, ChevronRight, Check,
  ArrowUp, ArrowDown, RefreshCw, Minus,
  Sparkles
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

// --- Data constants ---

const COUNTRIES = [
  { code: 'TZ', name: 'Tanzania', flag: '\u{1F1F9}\u{1F1FF}' },
  { code: 'KE', name: 'Kenya', flag: '\u{1F1F0}\u{1F1EA}' },
  { code: 'ZA', name: 'South Africa', flag: '\u{1F1FF}\u{1F1E6}' },
  { code: 'IN', name: 'India', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'PH', name: 'Philippines', flag: '\u{1F1F5}\u{1F1ED}' },
]

const POSITIONS = [
  { value: 'Top', label: 'Top', color: 'from-blue-500 to-blue-600', icon: ArrowUp },
  { value: 'Bottom', label: 'Bottom', color: 'from-rose-500 to-rose-600', icon: ArrowDown },
  { value: 'Versatile', label: 'Versatile', color: 'from-purple-500 to-purple-600', icon: RefreshCw },
  { value: 'Side', label: 'Side', color: 'from-amber-500 to-amber-600', icon: Minus },
]

const VIBES = [
  { value: 'Music', icon: Music },
  { value: 'Sports', icon: Dumbbell },
  { value: 'Food', icon: Utensils },
  { value: 'Movies', icon: Film },
  { value: 'Books', icon: BookOpen },
  { value: 'Gaming', icon: Gamepad2 },
  { value: 'Dance', icon: PartyPopper },
  { value: 'Nature', icon: Trees },
  { value: 'Travel', icon: Plane },
  { value: 'Photography', icon: Camera },
  { value: 'Cooking', icon: ChefHat },
  { value: 'Fashion', icon: Shirt },
  { value: 'Fitness', icon: Heart },
  { value: 'Art', icon: Palette },
  { value: 'Tech', icon: Cpu },
  { value: 'Meditation', icon: Flower2 },
]

const MOODS = [
  'Feeling social',
  'Chilling',
  'Ready to vibe',
  'Lowkey',
  'Deep thoughts',
]

const TAGS = [
  'Night owl',
  'Early bird',
  'Foodie',
  'Homebody',
  'Adventurous',
  'Cozy vibes',
  'Deep talker',
  'Fun & light',
  'Hopeless romantic',
  'Straightforward',
]

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

interface CityData {
  id: string
  name: string
}

export default function SetupFlow() {
  const { profile, setupStep, setSetupStep, updateProfile, setPage, setProfile } = useAppStore()
  const [direction, setDirection] = useState(0)
  const [saving, setSaving] = useState(false)
  const [cities, setCities] = useState<CityData[]>([])

  // Local form state
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [age, setAge] = useState<string>(profile?.age ? String(profile.age) : '')
  const [countryCode, setCountryCode] = useState(profile?.country_code || '')
  const [cityId, setCityId] = useState(profile?.city_id || '')
  const [position, setPosition] = useState(profile?.position || '')
  const [lookingFor, setLookingFor] = useState(profile?.looking_for || '')
  const [selectedVibes, setSelectedVibes] = useState<string[]>(profile?.vibes || [])
  const [bio, setBio] = useState(profile?.bio || '')
  const [mood, setMood] = useState(profile?.mood || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(profile?.tags || [])

  const maxBioLength = 100

  // Fetch cities when country changes
  useEffect(() => {
    if (!countryCode) {
      setCities([])
      setCityId('')
      return
    }
    const fetchCities = async () => {
      try {
        const res = await fetch(`/api/cities?country_code=${countryCode}`)
        const data = await res.json()
        if (data.cities) {
          setCities(data.cities.map((c: any) => ({ id: String(c.id), name: String(c.name) })))
        }
      } catch {
        setCities([])
      }
    }
    fetchCities()
  }, [countryCode])

  const goToStep = useCallback((step: number) => {
    setDirection(step > setupStep ? 1 : -1)
    setSetupStep(step)
  }, [setupStep, setSetupStep])

  const canProceed = (): boolean => {
    switch (setupStep) {
      case 1:
        return firstName.trim().length >= 2 && age !== '' && Number(age) >= 18 && Number(age) <= 99
      case 2:
        return countryCode !== '' && cityId !== ''
      case 3:
        return position !== '' && lookingFor !== ''
      case 4:
        return selectedVibes.length >= 1
      case 5:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    // Save current step data to store
    switch (setupStep) {
      case 1:
        updateProfile({ first_name: firstName.trim(), age: Number(age) })
        break
      case 2:
        updateProfile({ country_code: countryCode, city_id: cityId })
        break
      case 3:
        updateProfile({ position, looking_for: lookingFor })
        break
      case 4:
        updateProfile({ vibes: selectedVibes })
        break
      case 5:
        updateProfile({ bio, mood, tags: selectedTags })
        break
    }

    if (setupStep < 5) {
      goToStep(setupStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (setupStep > 1) {
      goToStep(setupStep - 1)
    }
  }

  const handleComplete = async () => {
    if (!profile?.id) return
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          first_name: firstName.trim(),
          age: Number(age),
          country_code: countryCode,
          city_id: cityId,
          position,
          looking_for: lookingFor,
          bio,
          mood,
          tags: selectedTags.join(','),
          vibes: selectedVibes.join(','),
        }),
      })
      const data = await res.json()
      if (data.profile) {
        // Convert DB profile to our format
        const p = data.profile
        setProfile({
          ...p,
          telegram_id: String(p.telegram_id),
          first_name: String(p.first_name || ''),
          age: p.age ? Number(p.age) : null,
          country_code: String(p.country_code || ''),
          city_id: p.city_id ? String(p.city_id) : null,
          city_name: p.city_name ? String(p.city_name) : undefined,
          country_name: p.country_name ? String(p.country_name) : undefined,
          country_flag: p.country_flag ? String(p.country_flag) : undefined,
          position: String(p.position || ''),
          looking_for: String(p.looking_for || ''),
          bio: String(p.bio || ''),
          mood: String(p.mood || ''),
          tags: p.tags ? String(p.tags).split(',').filter(Boolean) : [],
          vibes: p.vibes ? String(p.vibes).split(',').filter(Boolean) : [],
          subscription_tier: String(p.subscription_tier || 'free'),
          subscription_expires_at: p.subscription_expires_at ? String(p.subscription_expires_at) : null,
          profile_views: Number(p.profile_views || 0),
          streak: Number(p.streak || 0),
          is_banned: Number(p.is_banned) === 1,
          is_admin: Number(p.is_admin) === 1,
          daily_chats_used: Number(p.daily_chats_used || 0),
          daily_likes_used: Number(p.daily_likes_used || 0),
          daily_photos_sent: Number(p.daily_photos_sent || 0),
          daily_voice_sent: Number(p.daily_voice_sent || 0),
          daily_super_likes_used: Number(p.daily_super_likes_used || 0),
          daily_boost_used: Number(p.daily_boost_used || 0),
          daily_rewind_used: Number(p.daily_rewind_used || 0),
          daily_reset: String(p.daily_reset || ''),
          created_at: String(p.created_at || ''),
          last_active: String(p.last_active || ''),
        })
        setPage('discover')
      }
    } catch (err) {
      console.error('Profile save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const toggleVibe = (v: string) => {
    setSelectedVibes((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])
  }

  const toggleTag = (t: string) => {
    setSelectedTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])
  }

  // Step content renderers
  const renderStep = () => {
    switch (setupStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col gap-6"
          >
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-foreground">Tell us about you</h2>
              <p className="text-muted-foreground mt-1">Let others know who you are</p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">First Name</label>
                <Input
                  placeholder="Your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 rounded-xl text-base px-4"
                  maxLength={30}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Age</label>
                <Input
                  type="number"
                  placeholder="18 - 99"
                  value={age}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '' || (Number(v) >= 0 && Number(v) <= 99)) setAge(v)
                  }}
                  className="h-12 rounded-xl text-base px-4"
                  min={18}
                  max={99}
                />
                <p className="text-xs text-muted-foreground mt-1">You must be 18 or older</p>
              </div>
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            key="step2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col gap-6"
          >
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-foreground">Where are you?</h2>
              <p className="text-muted-foreground mt-1">Find people near you</p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Country</label>
                <div className="grid grid-cols-1 gap-2">
                  {COUNTRIES.map((c) => (
                    <motion.button
                      key={c.code}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setCountryCode(c.code)
                        setCityId('')
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                        countryCode === c.code
                          ? 'border-coral bg-coral/10 shadow-md'
                          : 'border-border bg-card hover:border-coral/50'
                      }`}
                    >
                      <span className="text-2xl">{c.flag}</span>
                      <span className="font-medium text-foreground">{c.name}</span>
                      {countryCode === c.code && (
                        <Check className="w-5 h-5 text-coral ml-auto" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {countryCode && cities.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="text-sm font-medium text-foreground mb-2 block">City</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {cities.map((c) => (
                      <motion.button
                        key={c.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setCityId(c.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-sm ${
                          cityId === c.id
                            ? 'border-coral bg-coral/10 shadow-md'
                            : 'border-border bg-card hover:border-coral/50'
                        }`}
                      >
                        <span className="font-medium text-foreground">{c.name}</span>
                        {cityId === c.id && <Check className="w-4 h-4 text-coral ml-auto" />}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            key="step3"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col gap-6"
          >
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-foreground">Your preferences</h2>
              <p className="text-muted-foreground mt-1">What are you looking for?</p>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Position</label>
                <div className="grid grid-cols-2 gap-3">
                  {POSITIONS.map((p) => {
                    const Icon = p.icon
                    const isSelected = position === p.value
                    return (
                      <motion.button
                        key={p.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPosition(p.value)}
                        className={`relative flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all ${
                          isSelected
                            ? 'border-transparent shadow-lg'
                            : 'border-border bg-card hover:border-coral/30'
                        }`}
                        style={isSelected ? {
                          background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                        } : {}}
                      >
                        {isSelected && (
                          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${p.color} opacity-10`} />
                        )}
                        <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${p.color}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className={`relative font-semibold text-sm ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {p.label}
                        </span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2"
                          >
                            <Check className="w-4 h-4 text-coral" />
                          </motion.div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Looking For</label>
                <div className="grid grid-cols-2 gap-3">
                  {POSITIONS.map((p) => {
                    const isSelected = lookingFor === p.value
                    return (
                      <motion.button
                        key={`lf-${p.value}`}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setLookingFor(p.value)}
                        className={`relative flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all ${
                          isSelected
                            ? 'border-transparent shadow-lg'
                            : 'border-border bg-card hover:border-coral/30'
                        }`}
                      >
                        {isSelected && (
                          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${p.color} opacity-10`} />
                        )}
                        <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${p.color}`}>
                          <span className="text-white font-bold text-sm">{p.label[0]}</span>
                        </div>
                        <span className={`relative font-semibold text-sm ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {p.label}
                        </span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2"
                          >
                            <Check className="w-4 h-4 text-coral" />
                          </motion.div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )

      case 4:
        return (
          <motion.div
            key="step4"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col gap-6"
          >
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-foreground">Your vibes</h2>
              <p className="text-muted-foreground mt-1">Select what interests you</p>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {VIBES.map((vibe) => {
                const Icon = vibe.icon
                const isSelected = selectedVibes.includes(vibe.value)
                return (
                  <motion.button
                    key={vibe.value}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleVibe(vibe.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2 transition-all min-h-[72px] ${
                      isSelected
                        ? 'border-coral bg-coral/15 shadow-md'
                        : 'border-border bg-card hover:border-coral/30'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-coral' : 'text-muted-foreground'}`} />
                    <span className={`text-[10px] font-medium leading-tight text-center ${isSelected ? 'text-coral' : 'text-muted-foreground'}`}>
                      {vibe.value}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {selectedVibes.length} selected
            </p>
          </motion.div>
        )

      case 5:
        return (
          <motion.div
            key="step5"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col gap-5"
          >
            <div className="text-center mb-1">
              <h2 className="text-2xl font-bold text-foreground">Almost there!</h2>
              <p className="text-muted-foreground mt-1">Add some personality</p>
            </div>

            <div className="flex flex-col gap-5">
              {/* Bio */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">Bio</label>
                  <span className={`text-xs ${bio.length > maxBioLength ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {bio.length}/{maxBioLength}
                  </span>
                </div>
                <Textarea
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => {
                    if (e.target.value.length <= maxBioLength) setBio(e.target.value)
                  }}
                  className="min-h-[80px] rounded-xl text-sm resize-none"
                  maxLength={maxBioLength}
                />
              </div>

              {/* Mood */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Mood</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <motion.button
                      key={m}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMood(m)}
                      className={`px-3.5 py-2 rounded-full text-xs font-medium border-2 transition-all ${
                        mood === m
                          ? 'border-coral bg-coral/15 text-coral'
                          : 'border-border bg-card text-muted-foreground hover:border-coral/30'
                      }`}
                    >
                      {m}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((t) => (
                    <motion.button
                      key={t}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleTag(t)}
                      className={`px-3.5 py-2 rounded-full text-xs font-medium border-2 transition-all ${
                        selectedTags.includes(t)
                          ? 'border-teal bg-teal/15 text-teal'
                          : 'border-border bg-card text-muted-foreground hover:border-teal/30'
                      }`}
                    >
                      {t}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Progress bar */}
      <div className="safe-top" />
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <motion.div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                style={{
                  borderColor: i + 1 <= setupStep ? '#FF6B6B' : 'var(--border)',
                  backgroundColor: i + 1 <= setupStep ? '#FF6B6B' : 'transparent',
                  color: i + 1 <= setupStep ? 'white' : 'var(--muted-foreground)',
                }}
                animate={{
                  scale: i + 1 === setupStep ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {i + 1 < setupStep ? <Check className="w-4 h-4" /> : i + 1}
              </motion.div>
              {i < 4 && (
                <div className="flex-1 h-0.5 rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #FF6B6B, #FFD93D)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: i + 1 < setupStep ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Overall progress */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #FF6B6B, #FFD93D, #2DD4BF)' }}
            animate={{ width: `${(setupStep / 5) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <AnimatePresence mode="wait" custom={direction}>
          {renderStep()}
        </AnimatePresence>
      </div>

      {/* Bottom buttons */}
      <div className="px-6 py-4 pb-8 flex gap-3">
        {setupStep > 1 && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="h-12 rounded-xl flex-1 text-sm font-semibold border-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          disabled={!canProceed() || saving}
          className="h-12 rounded-xl flex-1 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{
            background: canProceed()
              ? 'linear-gradient(135deg, #FF6B6B, #FF8E6B)'
              : undefined,
            boxShadow: canProceed() ? '0 4px 16px rgba(255, 107, 107, 0.3)' : undefined,
          }}
        >
          {saving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : setupStep === 5 ? (
            <>
              <Sparkles className="w-4 h-4" />
              Complete Profile
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
