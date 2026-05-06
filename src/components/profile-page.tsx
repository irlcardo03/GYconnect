'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2, Pencil, Smile, HelpCircle, Eye, Flame, Crown,
  Settings, User, Users, Shield, CreditCard, MessageSquare,
  Flag, Lock, FileText, Trash2, LogOut, ChevronRight, Copy,
  Check, Sparkles, MapPin
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogAction, AlertDialogCancel, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { useAppStore, type Profile } from '@/lib/store'

const POSITION_COLORS: Record<string, string> = {
  top: 'bg-coral text-white',
  bottom: 'bg-teal text-white',
  versatile: 'bg-gold text-deep',
  'top/versatile': 'bg-gradient-to-r from-coral to-gold text-white',
  'bottom/versatile': 'bg-gradient-to-r from-teal to-gold text-white',
  side: 'bg-purple-500 text-white',
}

const LOOKING_FOR_LABELS: Record<string, string> = {
  chat: 'Chat',
  dates: 'Dates',
  relationship: 'Relationship',
  friends: 'Friends',
  networking: 'Networking',
  fun: 'Fun',
}

const MOODS = [
  'Chill', 'Flirty', 'Adventurous', 'Romantic', 'Social',
  'Focused', 'Creative', 'Mysterious', 'Playful', 'Dreamy',
  'Energetic', 'Cozy', 'Confident', 'Curious', 'Vibing'
]

function ProfileCompletionBar({ profile }: { profile: Profile }) {
  const items = [
    { label: 'Photo', filled: !!profile.first_name },
    { label: 'Bio', filled: !!profile.bio && profile.bio.length > 10 },
    { label: 'Tags', filled: profile.tags.length >= 3 },
    { label: 'Vibes', filled: profile.vibes.length >= 1 },
    { label: 'Mood', filled: !!profile.mood },
    { label: 'City', filled: !!profile.city_name },
  ]
  const filled = items.filter(i => i.filled).length
  const percent = Math.round((filled / items.length) * 100)
  const missing = items.filter(i => !i.filled)

  return (
    <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Profile Completion</span>
          <span className="text-sm font-bold gradient-text">{percent}%</span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: 'linear-gradient(90deg, #FF6B6B, #2DD4BF)' }}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        {percent === 100 ? (
          <motion.p
            className="text-sm font-medium text-teal flex items-center gap-1.5"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Check className="size-4" /> Profile complete!
          </motion.p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {missing.map(item => (
              <span
                key={item.label}
                className="text-xs px-2 py-0.5 rounded-full bg-coral/10 text-coral font-medium"
              >
                Add {item.label}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuickActions({ profile }: { profile: Profile }) {
  const handleShare = () => {
    const text = `Check out GYconnect - the LGBTQ+ community app! Join me here: https://t.me/GYconnectBot`
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=https://t.me/GYconnectBot&text=${encodeURIComponent(text)}`
      )
    }
  }

  const actions = [
    { icon: Share2, label: 'Share Profile', color: 'bg-coral/10 text-coral', onClick: handleShare },
    { icon: Pencil, label: 'Edit Bio', color: 'bg-teal/10 text-teal', onClick: () => {} },
    { icon: Smile, label: 'Change Mood', color: 'bg-gold/10 text-gold-dark', onClick: () => {} },
    { icon: HelpCircle, label: 'Support', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', onClick: () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink('https://t.me/GYconnectSupport')
      }
    }},
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
      {actions.map((action) => (
        <motion.button
          key={action.label}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-medium ${action.color} shrink-0 min-h-[44px]`}
          onClick={action.onClick}
        >
          <action.icon className="size-4" />
          {action.label}
        </motion.button>
      ))}
    </div>
  )
}

function SettingItem({
  icon: Icon,
  label,
  color = 'text-foreground',
  onClick,
  danger = false
}: {
  icon: React.ElementType
  label: string
  color?: string
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors min-h-[44px] ${
        danger ? 'hover:bg-destructive/10' : 'hover:bg-muted'
      }`}
      onClick={onClick}
    >
      <div className={`size-9 rounded-lg flex items-center justify-center ${
        danger ? 'bg-destructive/10' : 'bg-muted'
      }`}>
        <Icon className={`size-4 ${danger ? 'text-destructive' : color}`} />
      </div>
      <span className={`flex-1 text-left text-sm font-medium ${
        danger ? 'text-destructive' : ''
      }`}>{label}</span>
      <ChevronRight className={`size-4 ${danger ? 'text-destructive/50' : 'text-muted-foreground'}`} />
    </motion.button>
  )
}

export function ProfilePage() {
  const { profile, setPage, updateProfile, setAdminTab } = useAppStore()
  const [moodDialogOpen, setMoodDialogOpen] = useState(false)
  const [bioDialogOpen, setBioDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false)
  const [termsDialogOpen, setTermsDialogOpen] = useState(false)
  const [editBio, setEditBio] = useState(profile?.bio || '')
  const [selectedMood, setSelectedMood] = useState(profile?.mood || '')
  const [reportText, setReportText] = useState('')
  const [copied, setCopied] = useState(false)

  if (!profile) return null

  const initial = profile.first_name?.charAt(0)?.toUpperCase() || '?'
  const positionColor = POSITION_COLORS[profile.position] || 'bg-muted text-muted-foreground'

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://t.me/GYconnectBot?start=${profile.telegram_id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveBio = () => {
    updateProfile({ bio: editBio })
    setBioDialogOpen(false)
  }

  const handleSaveMood = () => {
    updateProfile({ mood: selectedMood })
    setMoodDialogOpen(false)
  }

  const handleInvite = () => {
    const text = `Join me on GYconnect - the LGBTQ+ community app! Use my referral link:`
    const url = `https://t.me/GYconnectBot?start=ref_${profile.telegram_id}`
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
      )
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.close()
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="pb-24 space-y-5">
        {/* Gradient Header */}
        <div className="relative">
          <div
            className="h-40 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #FF6B6B, #FFD93D)' }}
          >
            {/* Watermark Initial */}
            <span className="absolute inset-0 flex items-center justify-center text-white/[0.12] text-[120px] font-bold select-none leading-none">
              {initial}
            </span>
            {/* Decorative Circles */}
            <div className="absolute -top-6 -right-6 size-28 rounded-full border-4 border-white/20" />
            <div className="absolute top-8 -left-4 size-16 rounded-full border-4 border-white/15" />
            <div className="absolute bottom-4 right-20 size-8 rounded-full bg-white/10" />
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <div className="relative">
              <div
                className="size-20 rounded-full border-4 border-background flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #FF6B6B, #FFD93D)' }}
              >
                {initial}
              </div>
              {/* Online Indicator */}
              <div className="absolute bottom-1 right-1">
                <span className="block size-4 rounded-full bg-emerald-500 border-2 border-background" />
                <span className="absolute inset-0 rounded-full bg-emerald-500 pulse-ring" />
              </div>
              {/* Streak Badge */}
              {profile.streak > 0 && (
                <motion.div
                  className="absolute -top-1 -right-1 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-deep text-gold text-xs font-bold shadow-md"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Flame className="size-3 fire-pulse" />
                  {profile.streak}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Name & Info */}
        <div className="pt-12 text-center space-y-2 px-4">
          <h2 className="text-xl font-bold">{profile.first_name}{profile.age ? `, ${profile.age}` : ''}</h2>
          {profile.country_name && (
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {profile.country_flag && <span>{profile.country_flag}</span>}
              <span>{profile.city_name ? `${profile.city_name}, ` : ''}{profile.country_name}</span>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge className={`${positionColor} border-0 font-semibold`}>
              {profile.position}
            </Badge>
            {profile.looking_for && (
              <Badge variant="outline" className="border-coral/30 text-coral">
                {LOOKING_FOR_LABELS[profile.looking_for] || profile.looking_for}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4">
          <QuickActions profile={profile} />
        </div>

        {/* Profile Completion */}
        <div className="px-4">
          <ProfileCompletionBar profile={profile} />
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 gap-3 px-4">
          {/* Profile Views */}
          <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="size-10 rounded-full bg-coral/10 flex items-center justify-center">
                <Eye className="size-5 text-coral" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{profile.profile_views}</p>
                <p className="text-xs text-muted-foreground">Views this week</p>
              </div>
            </CardContent>
          </Card>

          {/* Activity Streak */}
          <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="size-10 rounded-full bg-gold/15 flex items-center justify-center">
                <Flame className="size-5 text-gold-dark fire-pulse" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{profile.streak}</p>
                <p className="text-xs text-muted-foreground">Day streak</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status Card */}
        <div className="px-4">
          {profile.subscription_tier === 'free' ? (
            <Card
              className="border-0 shadow-md overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #2DD4BF, #14B8A6)' }}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white">All Features Free</p>
                    <p className="text-xs text-white/80">Full access for everyone</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => setPage('subscription')}
                >
                  Upgrade
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-md overflow-hidden gradient-border">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="size-5 text-gold" />
                    <Badge className="bg-gold/15 text-gold-dark border-0 font-semibold capitalize">
                      {profile.subscription_tier}
                    </Badge>
                  </div>
                  {profile.subscription_tier !== 'diamond' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-coral/30 text-coral hover:bg-coral/10"
                      onClick={() => setPage('subscription')}
                    >
                      Upgrade
                    </Button>
                  )}
                </div>
                {profile.subscription_expires_at && (
                  <p className="text-xs text-muted-foreground">
                    Expires {new Date(profile.subscription_expires_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="px-4 space-y-4">
          {profile.vibes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vibes</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.vibes.map(vibe => (
                  <Badge key={vibe} variant="secondary" className="bg-teal/10 text-teal border-0">
                    {vibe}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profile.mood && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mood</p>
              <Badge variant="secondary" className="bg-gold/10 text-gold-dark border-0">
                <Smile className="size-3 mr-1" />
                {profile.mood}
              </Badge>
            </div>
          )}

          {profile.tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profile.bio && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bio</p>
              <p className="text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="px-4">
          <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
            <CardContent className="p-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-2 pb-1">Settings</p>

              <SettingItem
                icon={User}
                label="Edit Profile"
                color="text-coral"
                onClick={() => { setPage('setup'); }}
              />
              <SettingItem
                icon={Smile}
                label="Change Mood"
                color="text-gold-dark"
                onClick={() => setMoodDialogOpen(true)}
              />
              <SettingItem
                icon={Users}
                label="Invite Friends"
                color="text-teal"
                onClick={handleInvite}
              />
              <SettingItem
                icon={CreditCard}
                label="Subscription"
                color="text-coral"
                onClick={() => setPage('subscription')}
              />
              <SettingItem
                icon={HelpCircle}
                label="Support Channel"
                color="text-teal"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                    window.Telegram.WebApp.openTelegramLink('https://t.me/GYconnectSupport')
                  }
                }}
              />
              <SettingItem
                icon={Flag}
                label="Report a Problem"
                color="text-gold-dark"
                onClick={() => setReportDialogOpen(true)}
              />
              <SettingItem
                icon={Lock}
                label="Privacy Policy"
                color="text-muted-foreground"
                onClick={() => setPrivacyDialogOpen(true)}
              />
              <SettingItem
                icon={FileText}
                label="Terms of Service"
                color="text-muted-foreground"
                onClick={() => setTermsDialogOpen(true)}
              />
              <SettingItem
                icon={Trash2}
                label="Delete Account"
                danger
                onClick={() => {}}
              />
              <SettingItem
                icon={LogOut}
                label="Log Out"
                danger
                onClick={() => {}}
              />

              {profile.is_admin && (
                <>
                  <div className="mx-3 my-2 h-px bg-border" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-1 pb-1">Admin</p>
                  <SettingItem
                    icon={Shield}
                    label="Admin Panel"
                    color="text-coral"
                    onClick={() => { setAdminTab('dashboard'); setPage('admin'); }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Delete Account AlertDialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className="hidden" id="delete-account-trigger" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Your profile, matches, and messages will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Log Out AlertDialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className="hidden" id="logout-trigger" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Log Out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out of GYconnect?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Mood Selector Dialog */}
        <Dialog open={moodDialogOpen} onOpenChange={setMoodDialogOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change Mood</DialogTitle>
              <DialogDescription>How are you feeling today?</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2 py-2">
              {MOODS.map(mood => (
                <motion.button
                  key={mood}
                  whileTap={{ scale: 0.95 }}
                  className={`py-3 px-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                    selectedMood === mood
                      ? 'bg-coral text-white shadow-md'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={() => setSelectedMood(mood)}
                >
                  {mood}
                </motion.button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMoodDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSaveMood}
                className="bg-gradient-to-r from-coral to-coral-dark text-white"
              >
                Save Mood
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Bio Dialog */}
        <Dialog open={bioDialogOpen} onOpenChange={setBioDialogOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Bio</DialogTitle>
              <DialogDescription>Tell others about yourself</DialogDescription>
            </DialogHeader>
            <textarea
              className="w-full min-h-[120px] p-3 rounded-xl border bg-muted/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-coral/50"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Write something about yourself..."
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">{editBio.length}/300</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBioDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSaveBio}
                className="bg-gradient-to-r from-coral to-coral-dark text-white"
              >
                Save Bio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Report a Problem</DialogTitle>
              <DialogDescription>Let us know what went wrong</DialogDescription>
            </DialogHeader>
            <textarea
              className="w-full min-h-[120px] p-3 rounded-xl border bg-muted/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-coral/50"
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Describe the issue..."
              maxLength={500}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => { setReportText(''); setReportDialogOpen(false) }}
                className="bg-gradient-to-r from-coral to-coral-dark text-white"
              >
                Submit Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Privacy Policy Dialog */}
        <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg max-h-[70vh]">
            <DialogHeader>
              <DialogTitle>Privacy Policy</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="text-sm text-muted-foreground space-y-3">
                <p><strong className="text-foreground">1. Information We Collect</strong></p>
                <p>We collect information you provide directly, including your profile details, messages, and preferences. We also collect usage data to improve our services.</p>
                <p><strong className="text-foreground">2. How We Use Your Information</strong></p>
                <p>Your information is used to provide and improve the GYconnect service, match you with other users, and ensure community safety.</p>
                <p><strong className="text-foreground">3. Data Protection</strong></p>
                <p>We implement industry-standard security measures to protect your data. Your messages are encrypted and your personal information is never shared with third parties without consent.</p>
                <p><strong className="text-foreground">4. Your Rights</strong></p>
                <p>You have the right to access, modify, or delete your personal data at any time through the app settings or by contacting our support team.</p>
                <p><strong className="text-foreground">5. Data Retention</strong></p>
                <p>We retain your data as long as your account is active. Upon account deletion, all personal data is permanently removed within 30 days.</p>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button onClick={() => setPrivacyDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Terms of Service Dialog */}
        <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg max-h-[70vh]">
            <DialogHeader>
              <DialogTitle>Terms of Service</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="text-sm text-muted-foreground space-y-3">
                <p><strong className="text-foreground">1. Acceptance of Terms</strong></p>
                <p>By using GYconnect, you agree to these terms. If you do not agree, please discontinue use of the service.</p>
                <p><strong className="text-foreground">2. Eligibility</strong></p>
                <p>You must be at least 18 years old to use GYconnect. By using the service, you represent that you meet this requirement.</p>
                <p><strong className="text-foreground">3. Community Guidelines</strong></p>
                <p>Treat all members with respect. Harassment, hate speech, discrimination, and spam are strictly prohibited and will result in account suspension.</p>
                <p><strong className="text-foreground">4. Subscriptions</strong></p>
                <p>Paid subscriptions are processed via cryptocurrency. All payments are final and non-refundable unless required by applicable law.</p>
                <p><strong className="text-foreground">5. Account Termination</strong></p>
                <p>We reserve the right to suspend or terminate accounts that violate our community guidelines or terms of service.</p>
                <p><strong className="text-foreground">6. Limitation of Liability</strong></p>
                <p>GYconnect is provided as-is. We are not responsible for interactions between users or any losses arising from use of the service.</p>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button onClick={() => setTermsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  )
}
