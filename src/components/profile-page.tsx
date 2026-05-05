'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pencil,
  Save,
  X,
  Crown,
  Shield,
  ExternalLink,
  Lock,
  Info,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

const POSITIONS = ['Top', 'Bottom', 'Versatile', 'Side']
const LOOKING_FOR = ['Chat', 'Dates', 'Friends', 'Networking', 'Fun']

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

export default function ProfilePage() {
  const { profile, setProfile, setPage, setAdminMode, isAdminMode } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])

  // Edit form state
  const [formUsername, setFormUsername] = useState('')
  const [formAge, setFormAge] = useState('')
  const [formBio, setFormBio] = useState('')
  const [formMood, setFormMood] = useState('')
  const [formPosition, setFormPosition] = useState('')
  const [formLookingFor, setFormLookingFor] = useState('')
  const [formCountryCode, setFormCountryCode] = useState('')
  const [formCityId, setFormCityId] = useState('')

  useEffect(() => {
    fetch('/api/countries')
      .then(res => res.json())
      .then(data => setCountries(data.countries || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (editing && formCountryCode) {
      fetch(`/api/cities?country_code=${formCountryCode}`)
        .then(res => res.json())
        .then(data => setCities(data.cities || []))
        .catch(() => {})
    }
  }, [editing, formCountryCode])

  const startEditing = () => {
    if (!profile) return
    setFormUsername(String(profile.username || ''))
    setFormAge(String(profile.age || ''))
    setFormBio(String(profile.bio || ''))
    setFormMood(String(profile.mood || ''))
    setFormPosition(String(profile.position || ''))
    setFormLookingFor(String(profile.looking_for || ''))
    setFormCountryCode(String(profile.country_code || ''))
    setFormCityId(String(profile.city_id || ''))
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
  }

  const handleSave = async () => {
    if (!profile?.id) return
    setSaving(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          username: formUsername.trim(),
          first_name: formUsername.trim(),
          age: formAge ? parseInt(formAge) : null,
          bio: formBio.trim(),
          mood: formMood.trim(),
          position: formPosition,
          looking_for: formLookingFor,
          country_code: formCountryCode,
          city_id: formCityId,
        }),
      })

      const data = await res.json()
      if (data.profile) {
        setProfile({ ...profile, ...data.profile } as any)
        setEditing(false)
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  const tierColor = (tier: string) => {
    switch (tier) {
      case 'gold': return '#F59E0B'
      case 'platinum': return '#94A3B8'
      case 'diamond': return '#2DD4BF'
      default: return '#6B7280'
    }
  }

  const tierName = (tier: string) => {
    switch (tier) {
      case 'gold': return 'Gold'
      case 'platinum': return 'Platinum'
      case 'diamond': return 'Diamond'
      default: return 'Free'
    }
  }

  if (!profile) return null

  return (
    <div className="min-h-screen px-4 pt-6 pb-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          {!editing ? (
            <Button
              onClick={startEditing}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white gap-1.5"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={cancelEditing}
                variant="ghost"
                size="sm"
                className="text-gray-400"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                disabled={saving}
                className="text-white gap-1.5"
                style={{ backgroundColor: '#FF6B6B' }}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4"
        >
          {/* Avatar & Tier */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-400">
                {(profile.first_name || profile.username || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">
                {String(profile.first_name || profile.username || 'Anonymous')}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className="text-white border-0 text-xs"
                  style={{ backgroundColor: tierName(profile.subscription_tier) === 'Free' ? '#6B7280' : tierColor(profile.subscription_tier) }}
                >
                  <Crown className="w-3 h-3 mr-1" />
                  {tierName(profile.subscription_tier)}
                </Badge>
                {Number(profile.is_admin) === 1 && (
                  <Badge className="text-white border-0 text-xs" style={{ backgroundColor: '#FF6B6B' }}>
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            {editing ? (
              <>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Username</label>
                  <Input
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Age</label>
                  <Input
                    type="number"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 text-white"
                    min={18}
                    max={99}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Bio</label>
                  <Textarea
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 text-white min-h-20"
                    placeholder="Tell people about yourself..."
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Mood</label>
                  <Input
                    value={formMood}
                    onChange={(e) => setFormMood(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 text-white"
                    placeholder="What's your vibe?"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Position</label>
                  <Select value={formPosition} onValueChange={setFormPosition}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {POSITIONS.map((p) => (
                        <SelectItem key={p} value={p} className="text-white focus:bg-gray-700 focus:text-white">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Looking For</label>
                  <Select value={formLookingFor} onValueChange={setFormLookingFor}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {LOOKING_FOR.map((l) => (
                        <SelectItem key={l} value={l} className="text-white focus:bg-gray-700 focus:text-white">
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Country</label>
                  <Select value={formCountryCode} onValueChange={(v) => { setFormCountryCode(v); setFormCityId('') }}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
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
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">City</label>
                  <Select value={formCityId} onValueChange={setFormCityId} disabled={!formCountryCode}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder={formCountryCode ? 'Select city' : 'Select country first'} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 max-h-64">
                      {cities.map((c) => (
                        <SelectItem key={String(c.id)} value={String(c.id)} className="text-white focus:bg-gray-700 focus:text-white">
                          {String(c.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                {/* View Mode */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Age</p>
                    <p className="text-white text-sm font-medium">{profile.age || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Position</p>
                    <p className="text-white text-sm font-medium">{profile.position || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Looking For</p>
                    <p className="text-white text-sm font-medium">{profile.looking_for || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Views</p>
                    <p className="text-white text-sm font-medium">{Number(profile.profile_views) || 0}</p>
                  </div>
                </div>
                {profile.bio && (
                  <div>
                    <p className="text-xs text-gray-500">Bio</p>
                    <p className="text-gray-300 text-sm">{String(profile.bio)}</p>
                  </div>
                )}
                {profile.mood && (
                  <div>
                    <p className="text-xs text-gray-500">Mood</p>
                    <p className="text-gray-300 text-sm">{String(profile.mood)}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Upgrade Button */}
        {profile.subscription_tier === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <Button
              onClick={() => setPage('subscription')}
              className="w-full text-white rounded-xl h-11"
              style={{ backgroundColor: '#F59E0B' }}
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </motion.div>
        )}

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
        >
          <h3 className="text-sm font-semibold text-gray-400 px-6 pt-5 pb-2">Settings</h3>

          {/* Support Channel */}
          <a
            href="https://t.me/+QAQB2vigDAlhOGFk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-white">Support Channel</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </a>

          {/* Privacy */}
          <div className="flex items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-white">Privacy Policy</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>

          {/* About */}
          <div className="flex items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-white">About GYconnect</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>

          {/* Admin Mode Toggle */}
          {Number(profile.is_admin) === 1 && (
            <button
              onClick={() => { setAdminMode(!isAdminMode); if (!isAdminMode) setPage('admin') }}
              className="flex items-center justify-between px-6 py-3.5 w-full hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4" style={{ color: '#FF6B6B' }} />
                <span className="text-sm text-white">Admin Panel</span>
              </div>
              <Badge className={isAdminMode ? 'text-white border-0' : 'text-gray-400 border-gray-700'} style={isAdminMode ? { backgroundColor: '#FF6B6B' } : {}}>
                {isAdminMode ? 'Active' : 'Off'}
              </Badge>
            </button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
