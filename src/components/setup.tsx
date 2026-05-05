'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronRight, User, MapPin, Calendar, Hash, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface Country {
  id: string
  name: string
  code: string
  flag: string
}

interface City {
  id: string
  name: string
  country_code: string
}

const POSITIONS = ['Top', 'Bottom', 'Versatile', 'Side']

const ADMIN_ID = '8262090447'

export default function Setup() {
  const { profile, setProfile, setupStep, setSetupStep, setPage, setAdminMode, setProfile: setStoreProfile } = useAppStore()

  const [username, setUsername] = useState('')
  const [age, setAge] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [cityId, setCityId] = useState('')
  const [position, setPosition] = useState('')
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/countries')
      .then(res => res.json())
      .then(data => setCountries(data.countries || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (countryCode) {
      fetch(`/api/cities?country_code=${countryCode}`)
        .then(res => res.json())
        .then(data => setCities(data.cities || []))
        .catch(() => {})
      setCityId('')
    }
  }, [countryCode])

  const progressValue = (setupStep / 5) * 100

  const canNext = () => {
    switch (setupStep) {
      case 1: return username.trim().length >= 2
      case 2: return age && parseInt(age) >= 18 && parseInt(age) <= 99
      case 3: return countryCode !== ''
      case 4: return cityId !== ''
      case 5: return position !== ''
      default: return false
    }
  }

  const handleNext = () => {
    if (setupStep < 5) {
      setSetupStep(setupStep + 1)
    }
  }

  const handleBack = () => {
    if (setupStep > 1) {
      setSetupStep(setupStep - 1)
    }
  }

  const handleComplete = async () => {
    if (!profile?.id) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          username: username.trim(),
          first_name: username.trim(),
          age: parseInt(age),
          country_code: countryCode,
          city_id: cityId,
          position,
        }),
      })

      const data = await res.json()

      if (data.profile) {
        setProfile({ ...profile, ...data.profile } as any)
        setPage('discover')
      } else {
        setError(data.error || 'Failed to save profile')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const stepIcons = [User, Calendar, MapPin, MapPin, Hash]

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

  const [direction, setDirection] = useState(0)

  const goNext = () => {
    setDirection(1)
    // Check if username is admin Telegram ID
    if (setupStep === 1 && username.trim() === ADMIN_ID) {
      setAdminMode(true)
      // Re-auth as admin
      const reauth = async () => {
        const tg = (window as any).Telegram?.WebApp
        const telegramId = tg ? String(tg.initDataUnsafe?.user?.id || '') : (localStorage.getItem('gyconnect_demo_id') || '')
        const authRes = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id: ADMIN_ID, username: ADMIN_ID }),
        })
        if (authRes.ok) {
          const authData = await authRes.json()
          if (authData.profile) {
            setProfile({ ...authData.profile, is_admin: 1, first_name: 'Admin' } as any)
            setPage('admin')
            return
          }
        }
      }
      reauth()
      return
    }
    handleNext()
  }

  const goBack = () => {
    setDirection(-1)
    handleBack()
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          {setupStep > 1 ? (
            <button onClick={goBack} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-5" />
          )}
          <span className="text-gray-400 text-sm font-medium">Step {setupStep} of 5</span>
          <div className="w-5" />
        </div>
        <Progress value={progressValue} className="h-1.5 bg-gray-700" />
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={setupStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full max-w-sm flex flex-col items-center gap-6"
          >
            {/* Step Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#FF6B6B20' }}
            >
              {(() => {
                const Icon = stepIcons[setupStep - 1]
                return <Icon className="w-8 h-8" style={{ color: '#FF6B6B' }} />
              })()}
            </div>

            {/* Step Title */}
            <h2 className="text-2xl font-bold text-white text-center">
              {setupStep === 1 && 'Choose Your Username'}
              {setupStep === 2 && 'How Old Are You?'}
              {setupStep === 3 && 'Where Are You From?'}
              {setupStep === 4 && 'Select Your City'}
              {setupStep === 5 && 'Your Position'}
            </h2>

            <p className="text-gray-400 text-sm text-center">
              {setupStep === 1 && 'This will be your display name in the community'}
              {setupStep === 2 && 'You must be 18 or older to join'}
              {setupStep === 3 && 'We will show you people near you'}
              {setupStep === 4 && 'Help us find matches in your area'}
              {setupStep === 5 && 'This helps with better matching'}
            </p>

            {/* Step Input */}
            <div className="w-full mt-2">
              {setupStep === 1 && (
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="h-12 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl text-center text-lg"
                  maxLength={30}
                  autoFocus
                />
              )}

              {setupStep === 2 && (
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 99)) {
                      setAge(val)
                    }
                  }}
                  placeholder="Enter your age"
                  className="h-12 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl text-center text-lg"
                  min={18}
                  max={99}
                  autoFocus
                />
              )}

              {setupStep === 3 && (
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="h-12 bg-gray-800/50 border-gray-700 text-white rounded-xl w-full">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 max-h-64">
                    {countries.map((c) => (
                      <SelectItem key={String(c.code)} value={String(c.code)} className="text-white focus:bg-gray-700 focus:text-white">
                        {c.flag ? `${c.flag} ` : ''}{String(c.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {setupStep === 4 && (
                <Select value={cityId} onValueChange={setCityId} disabled={!countryCode}>
                  <SelectTrigger className="h-12 bg-gray-800/50 border-gray-700 text-white rounded-xl w-full">
                    <SelectValue placeholder={countryCode ? 'Select city' : 'Select country first'} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 max-h-64">
                    {cities.map((c) => (
                      <SelectItem key={String(c.id)} value={String(c.id)} className="text-white focus:bg-gray-700 focus:text-white">
                        {String(c.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {setupStep === 5 && (
                <div className="grid grid-cols-2 gap-3">
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPosition(pos)}
                      className={`h-14 rounded-xl font-semibold text-base transition-all ${
                        position === pos
                          ? 'text-white shadow-lg'
                          : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                      style={position === pos ? { backgroundColor: '#FF6B6B' } : {}}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Action */}
      <div className="px-6 pb-8">
        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}
        <Button
          onClick={setupStep === 5 ? handleComplete : goNext}
          disabled={!canNext() || loading}
          size="lg"
          className="w-full h-12 text-base font-semibold text-white rounded-xl"
          style={{ backgroundColor: '#FF6B6B' }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : setupStep === 5 ? (
            'Complete'
          ) : (
            <span className="flex items-center gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
