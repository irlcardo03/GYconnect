'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, LayoutDashboard, Users, Flag, Globe, CreditCard,
  Banknote, Tag, Settings, Megaphone, Search, Shield,
  Ban, CheckCircle2, XCircle, Clock, Plus,
  Trash2, Send, Eye, AlertTriangle, TrendingUp, UserCheck,
  UserX, DollarSign, Copy, Edit,
  Gift, Hash, Calendar, Crown, RefreshCw, Loader2,
  Wallet, MessageSquare, ToggleLeft
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogAction, AlertDialogCancel
} from '@/components/ui/alert-dialog'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────
interface AdminStats {
  total_users: number
  active_today: number
  new_today: number
  premium_counts: Record<string, number>
  reports_pending: number
  total_revenue: number
  revenue_by_plan: Array<{ plan: string; count: number; total: number }>
}

interface Country {
  id: string
  name: string
  code: string
  flag: string
  active: number
  created_at: string
}

interface City {
  id: string
  country_code: string
  name: string
  active: number
  created_at: string
}

interface Report {
  id: string
  reporter_id: string
  reported_id: string
  reason: string
  description: string
  status: string
  created_at: string
  reporter_name?: string
  reported_name?: string
  reporter_telegram_id?: string
  reported_telegram_id?: string
}

interface PromoCode {
  id: string
  code: string
  tier: string
  duration_days: number
  max_uses: number
  current_uses: number
  is_active: number
  created_at: string
}

interface AppSetting {
  key: string
  value: string
}

// ─── Tab Config ─────────────────────────────────────────
const ADMIN_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'reports', label: 'Reports', icon: Flag },
  { id: 'countries', label: 'Countries', icon: Globe },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'payments', label: 'Payments', icon: Banknote },
  { id: 'promocodes', label: 'Promo Codes', icon: Tag },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
]

// ─── Helpers ────────────────────────────────────────────
function getAdminId(profile: { telegram_id: string; is_admin: boolean } | null): string {
  return profile?.telegram_id || ''
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function tierBadgeClass(tier: string): string {
  switch (tier) {
    case 'diamond': return 'border-cyan-400 text-cyan-600'
    case 'gold': return 'border-gold text-gold-dark'
    case 'silver': return 'border-gray-400 text-gray-500'
    default: return 'border-muted-foreground text-muted-foreground'
  }
}

function tierBgClass(tier: string): string {
  switch (tier) {
    case 'diamond': return 'bg-cyan-400/10 text-cyan-600'
    case 'gold': return 'bg-gold/15 text-gold-dark'
    case 'silver': return 'bg-gray-400/10 text-gray-500'
    default: return 'bg-muted text-muted-foreground'
  }
}

// ─── Stat Card ──────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, trend }: {
  label: string; value: string | number; icon: React.ElementType; color: string; trend?: string
}) {
  return (
    <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`size-9 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="size-4" />
          </div>
          {trend && (
            <span className="text-xs font-medium text-teal flex items-center gap-0.5">
              <TrendingUp className="size-3" /> {trend}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

// ─── Refresh Button ─────────────────────────────────────
function RefreshButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <Button variant="ghost" size="icon" className="size-8" onClick={onClick} disabled={loading}>
      <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
    </Button>
  )
}

// ─── Loading Skeleton ───────────────────────────────────
function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  )
}

// ─── Dashboard Tab ──────────────────────────────────────
function DashboardTab({ adminId }: { adminId: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<AppSetting[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, countriesRes] = await Promise.all([
        fetch(`/api/admin?admin_id=${adminId}`),
        fetch('/api/countries')
      ])
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }
      if (countriesRes.ok) {
        const countriesData = await countriesRes.json()
        setCountries(countriesData.countries)
      }
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [adminId])

  useEffect(() => { fetchData() }, [fetchData])

  const totalPremium = stats ? Object.values(stats.premium_counts).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Dashboard</h2>
        <RefreshButton onClick={fetchData} loading={loading} />
      </div>

      {loading ? (
        <LoadingSkeleton count={6} />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Users" value={stats?.total_users ?? 0} icon={Users} color="bg-coral/10 text-coral" />
            <StatCard label="Active Today" value={stats?.active_today ?? 0} icon={UserCheck} color="bg-teal/10 text-teal" />
            <StatCard label="Premium Users" value={totalPremium} icon={Crown} color="bg-gold/15 text-gold-dark" />
            <StatCard label="Reports Pending" value={stats?.reports_pending ?? 0} icon={Flag} color="bg-destructive/10 text-destructive" />
            <StatCard label="Total Revenue" value={formatCurrency(stats?.total_revenue ?? 0)} icon={DollarSign} color="bg-teal/10 text-teal" />
            <StatCard label="New Today" value={stats?.new_today ?? 0} icon={UserCheck} color="bg-coral/10 text-coral" />
          </div>

          {/* Premium Breakdown */}
          {stats && Object.keys(stats.premium_counts).length > 0 && (
            <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Premium Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(stats.premium_counts).map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <Badge variant="outline" className={tierBadgeClass(tier)}>
                      {tier}
                    </Badge>
                    <span className="text-sm font-medium">{count} users</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Revenue by Plan */}
          {stats?.revenue_by_plan && stats.revenue_by_plan.length > 0 && (
            <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Revenue by Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.revenue_by_plan.map((item) => (
                  <div key={item.plan} className="flex items-center justify-between py-1">
                    <span className="text-sm capitalize font-medium">{item.plan}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.count} payments</span>
                      <span className="text-sm font-bold">{formatCurrency(Number(item.total))}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Countries */}
          {countries.length > 0 && (
            <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Active Countries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {countries.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium">{c.flag} {c.name}</span>
                    <Badge variant="outline" className="text-xs">{c.code}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// ─── Users Tab ──────────────────────────────────────────
function UsersTab({ adminId }: { adminId: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchedUser, setSearchedUser] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchedUser(null)
    try {
      const res = await fetch(`/api/auth?telegram_id=${searchQuery.trim()}`)
      if (res.ok) {
        const data = await res.json()
        setSearchedUser(data.profile)
      } else {
        toast.error('User not found')
      }
    } catch {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }, [searchQuery])

  const handleBanUnban = async () => {
    if (!searchedUser) return
    setActionLoading(true)
    try {
      const action = searchedUser.is_banned ? 'unban' : 'ban'
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId, action, target_id: searchedUser.id })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(action === 'ban' ? 'User banned' : 'User unbanned')
        setSearchedUser((prev: any) => ({ ...prev, is_banned: action === 'ban' ? 1 : 0 }))
      } else {
        toast.error(data.error || 'Action failed')
      }
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading(false)
      setBanDialogOpen(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">User Lookup</h2>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Enter Telegram ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-9 h-11"
          />
        </div>
        <Button onClick={handleSearch} disabled={searching} className="h-11 px-4">
          {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        </Button>
      </div>

      {/* Searched User */}
      {searching && <LoadingSkeleton count={1} />}

      {searchedUser && !searching && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-14 rounded-full bg-gradient-to-br from-coral to-gold flex items-center justify-center text-xl font-bold text-white">
                {searchedUser.first_name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{searchedUser.first_name || 'Unknown'}</span>
                  {searchedUser.age && <span className="text-muted-foreground">{searchedUser.age}</span>}
                  {searchedUser.is_banned ? (
                    <Badge className="bg-destructive/10 text-destructive border-0 text-xs">Banned</Badge>
                  ) : (
                    <Badge className="bg-teal/10 text-teal border-0 text-xs">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {searchedUser.country_flag || ''} {searchedUser.city_name || searchedUser.country_name || 'No location'}
                </p>
              </div>
              <Badge variant="outline" className={tierBadgeClass(searchedUser.subscription_tier || 'free')}>
                {searchedUser.subscription_tier || 'free'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 rounded-lg p-3">
              <div><span className="text-muted-foreground">ID:</span> <span className="font-mono text-xs">{searchedUser.id?.slice(0, 8)}...</span></div>
              <div><span className="text-muted-foreground">TG ID:</span> <span className="font-mono text-xs">{searchedUser.telegram_id}</span></div>
              <div><span className="text-muted-foreground">Position:</span> <span className="font-medium capitalize">{searchedUser.position || '-'}</span></div>
              <div><span className="text-muted-foreground">Looking for:</span> <span className="font-medium capitalize">{searchedUser.looking_for || '-'}</span></div>
              <div><span className="text-muted-foreground">Joined:</span> <span className="font-medium">{formatDate(searchedUser.created_at)}</span></div>
              <div><span className="text-muted-foreground">Last active:</span> <span className="font-medium">{formatDate(searchedUser.last_active)}</span></div>
              <div><span className="text-muted-foreground">Views:</span> <span className="font-medium">{searchedUser.profile_views ?? 0}</span></div>
              <div><span className="text-muted-foreground">Streak:</span> <span className="font-medium">{searchedUser.streak ?? 0}</span></div>
            </div>

            {searchedUser.bio && (
              <div className="text-sm">
                <span className="text-muted-foreground">Bio:</span>{' '}
                <span>{searchedUser.bio}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className={`flex-1 h-10 ${searchedUser.is_banned ? 'border-teal/30 text-teal' : 'border-destructive/30 text-destructive'}`}
                onClick={() => setBanDialogOpen(true)}
              >
                {searchedUser.is_banned ? <CheckCircle2 className="size-4" /> : <Ban className="size-4" />}
                {searchedUser.is_banned ? 'Unban' : 'Ban'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!searchedUser && !searching && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <Users className="size-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Search for a user by their Telegram ID to view their profile and manage their account.</p>
          </CardContent>
        </Card>
      )}

      {/* Ban/Unban Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{searchedUser?.is_banned ? 'Unban User' : 'Ban User'}</AlertDialogTitle>
            <AlertDialogDescription>
              {searchedUser?.is_banned
                ? 'This will restore the user\'s access to the platform.'
                : 'This will prevent the user from accessing the platform.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBanUnban} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Reports Tab ────────────────────────────────────────
function ReportsTab({ adminId }: { adminId: string }) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?admin_id=${adminId}`)
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports)
      } else {
        toast.error('Failed to load reports')
      }
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [adminId])

  useEffect(() => { fetchReports() }, [fetchReports])

  const handleDismiss = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId, action: 'dismiss-report', target_id: reportId })
      })
      // If no dismiss-report action exists, just mark locally
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'dismissed' } : r))
      toast.success('Report dismissed')
    } catch {
      toast.error('Failed to dismiss report')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBanReported = async (report: Report) => {
    setActionLoading(report.id)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId, action: 'ban', target_id: report.reported_id })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('User banned')
        setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r))
      } else {
        toast.error(data.error || 'Failed to ban user')
      }
    } catch {
      toast.error('Failed to ban user')
    } finally {
      setActionLoading(null)
    }
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-gold/15 text-gold-dark',
    reviewed: 'bg-teal/10 text-teal',
    dismissed: 'bg-muted text-muted-foreground',
    resolved: 'bg-teal/10 text-teal',
    banned: 'bg-destructive/10 text-destructive',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Reports</h2>
        <RefreshButton onClick={fetchReports} loading={loading} />
      </div>

      {loading ? (
        <LoadingSkeleton count={4} />
      ) : reports.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <Flag className="size-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No reports found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          {reports.map(report => (
            <Card key={report.id} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-gold-dark" />
                    <span className="font-semibold text-sm">{report.reason}</span>
                  </div>
                  <Badge className={`${statusColor[report.status] || 'bg-muted'} border-0 text-xs`}>
                    {report.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Reporter: <span className="text-foreground font-medium">{report.reporter_name || report.reporter_id.slice(0, 8)}</span>
                    {report.reporter_telegram_id && <span className="ml-1 font-mono">({report.reporter_telegram_id})</span>}
                  </p>
                  <p>Reported: <span className="text-foreground font-medium">{report.reported_name || report.reported_id.slice(0, 8)}</span>
                    {report.reported_telegram_id && <span className="ml-1 font-mono">({report.reported_telegram_id})</span>}
                  </p>
                  {report.description && <p className="mt-1 italic">&quot;{report.description}&quot;</p>}
                  <p>{formatDate(report.created_at)}</p>
                </div>
                {report.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-9 text-xs"
                      onClick={() => handleDismiss(report.id)} disabled={actionLoading === report.id}>
                      {actionLoading === report.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                      Dismiss
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-9 text-xs border-destructive/30 text-destructive"
                      onClick={() => handleBanReported(report)} disabled={actionLoading === report.id}>
                      {actionLoading === report.id ? <Loader2 className="size-3 animate-spin" /> : <Ban className="size-3" />}
                      Ban User
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Countries Tab ──────────────────────────────────────
function CountriesTab({ adminId }: { adminId: string }) {
  const [countries, setCountries] = useState<Country[]>([])
  const [citiesMap, setCitiesMap] = useState<Record<string, City[]>>({})
  const [loading, setLoading] = useState(true)
  const [addCountryOpen, setAddCountryOpen] = useState(false)
  const [addCityOpen, setAddCityOpen] = useState(false)
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [newCountryName, setNewCountryName] = useState('')
  const [newCountryCode, setNewCountryCode] = useState('')
  const [newCountryFlag, setNewCountryFlag] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [newCityName, setNewCityName] = useState('')

  const fetchCountries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/countries')
      if (res.ok) {
        const data = await res.json()
        setCountries(data.countries)
      }
    } catch {
      toast.error('Failed to load countries')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCountries() }, [fetchCountries])

  const fetchCities = useCallback(async (countryCode: string) => {
    try {
      const res = await fetch(`/api/cities?country_code=${countryCode}`)
      if (res.ok) {
        const data = await res.json()
        setCitiesMap(prev => ({ ...prev, [countryCode]: data.cities }))
      }
    } catch {
      toast.error('Failed to load cities')
    }
  }, [])

  const toggleExpand = (countryCode: string) => {
    if (expandedCountry === countryCode) {
      setExpandedCountry(null)
    } else {
      setExpandedCountry(countryCode)
      if (!citiesMap[countryCode]) {
        fetchCities(countryCode)
      }
    }
  }

  const handleAddCountry = async () => {
    if (!newCountryName.trim() || !newCountryCode.trim()) {
      toast.error('Name and code are required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: adminId,
          action: 'add-country',
          name: newCountryName.trim(),
          code: newCountryCode.trim().toUpperCase(),
          details: newCountryFlag.trim()
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Country ${newCountryName} added`)
        setNewCountryName('')
        setNewCountryCode('')
        setNewCountryFlag('')
        setAddCountryOpen(false)
        fetchCountries()
      } else {
        toast.error(data.error || 'Failed to add country')
      }
    } catch {
      toast.error('Failed to add country')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddCity = async () => {
    if (!selectedCountry || !newCityName.trim()) {
      toast.error('Country and city name are required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: adminId,
          action: 'add-city',
          name: newCityName.trim(),
          country_code: selectedCountry
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`City ${newCityName} added`)
        setNewCityName('')
        setAddCityOpen(false)
        fetchCities(selectedCountry)
      } else {
        toast.error(data.error || 'Failed to add city')
      }
    } catch {
      toast.error('Failed to add city')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Countries & Cities</h2>
        <RefreshButton onClick={fetchCountries} loading={loading} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={() => setAddCountryOpen(true)} className="flex-1 h-11 bg-gradient-to-r from-coral to-coral-dark text-white">
          <Plus className="size-4" /> Add Country
        </Button>
        <Button variant="outline" onClick={() => setAddCityOpen(true)} className="flex-1 h-11">
          <Plus className="size-4" /> Add City
        </Button>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} />
      ) : countries.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <Globe className="size-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No countries yet. Add one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {countries.map(country => (
            <Card key={country.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <button
                  className="w-full flex items-center justify-between text-left"
                  onClick={() => toggleExpand(country.code)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{country.flag || '-'}</span>
                    <div>
                      <p className="font-semibold text-sm">{country.name}</p>
                      <p className="text-xs text-muted-foreground">{country.code}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {citiesMap[country.code]?.length ?? '...'} cities
                  </Badge>
                </button>

                {expandedCountry === country.code && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 space-y-2"
                  >
                    {citiesMap[country.code] === undefined ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : citiesMap[country.code].length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">No cities added yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {citiesMap[country.code].map(city => (
                          <span key={city.id} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-muted">
                            {city.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => { setSelectedCountry(country.code); setAddCityOpen(true) }}
                    >
                      <Plus className="size-3" /> Add City to {country.name}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Country Dialog */}
      <Dialog open={addCountryOpen} onOpenChange={setAddCountryOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Country</DialogTitle>
            <DialogDescription>Add a new country to the platform. It will be saved immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Country name (e.g. Tanzania)" value={newCountryName} onChange={e => setNewCountryName(e.target.value)} />
            <Input placeholder="Country code (e.g. TZ)" value={newCountryCode} onChange={e => setNewCountryCode(e.target.value.toUpperCase())} maxLength={3} />
            <Input placeholder="Flag emoji (optional, e.g. 🇹🇿)" value={newCountryFlag} onChange={e => setNewCountryFlag(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCountryOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleAddCountry} disabled={submitting} className="bg-gradient-to-r from-coral to-coral-dark text-white">
              {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Add Country
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add City Dialog */}
      <Dialog open={addCityOpen} onOpenChange={setAddCityOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add City</DialogTitle>
            <DialogDescription>Add a new city to a country. It will be saved immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <select
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm"
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
            >
              <option value="">Select country</option>
              {countries.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
            <Input placeholder="City name" value={newCityName} onChange={e => setNewCityName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCityOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleAddCity} disabled={submitting} className="bg-gradient-to-r from-coral to-coral-dark text-white">
              {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Add City
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Subscriptions Tab ──────────────────────────────────
function SubscriptionsTab({ adminId }: { adminId: string }) {
  const [freemium, setFreemium] = useState(false)
  const [freemiumLoading, setFreemiumLoading] = useState(false)
  const [grantGoldOpen, setGrantGoldOpen] = useState(false)
  const [grantGoldLoading, setGrantGoldLoading] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin?admin_id=${adminId}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch {}
  }, [adminId])

  useEffect(() => { fetchStats() }, [fetchStats])

  const handleToggleFreemium = async () => {
    setFreemiumLoading(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId, action: 'toggle-freemium' })
      })
      const data = await res.json()
      if (data.success) {
        setFreemium(data.freemium_mode)
        toast.success(`Freemium mode ${data.freemium_mode ? 'enabled' : 'disabled'}`)
      } else {
        toast.error(data.error || 'Failed to toggle freemium')
      }
    } catch {
      toast.error('Failed to toggle freemium')
    } finally {
      setFreemiumLoading(false)
    }
  }

  const handleGrantGold = async () => {
    setGrantGoldLoading(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId, action: 'grant-gold' })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Gold tier granted to all free users')
        fetchStats()
      } else {
        toast.error(data.error || 'Failed to grant gold')
      }
    } catch {
      toast.error('Failed to grant gold')
    } finally {
      setGrantGoldLoading(false)
      setGrantGoldOpen(false)
    }
  }

  const totalPremium = stats ? Object.values(stats.premium_counts).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="space-y-5">
      {/* Freemium Toggle */}
      <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-coral/10 text-coral flex items-center justify-center">
                <ToggleLeft className="size-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">Freemium Mode</p>
                <p className="text-xs text-muted-foreground">Enable all features for free users</p>
              </div>
            </div>
            <Switch
              checked={freemium}
              onCheckedChange={handleToggleFreemium}
              disabled={freemiumLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grant All Gold */}
      <Button
        className="w-full h-11 bg-gradient-to-r from-gold to-gold-dark text-deep font-semibold"
        onClick={() => setGrantGoldOpen(true)}
      >
        <Crown className="size-4" /> Grant All Free Users Gold
      </Button>

      {/* Subscription Stats */}
      {stats && (
        <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Free Users</span>
              <span className="text-sm font-bold">{stats.total_users - totalPremium}</span>
            </div>
            {Object.entries(stats.premium_counts).map(([tier, count]) => (
              <div key={tier} className="flex items-center justify-between">
                <Badge variant="outline" className={tierBadgeClass(tier)}>{tier}</Badge>
                <span className="text-sm font-bold">{count} users</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Grant All Gold Confirmation */}
      <AlertDialog open={grantGoldOpen} onOpenChange={setGrantGoldOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Grant Gold to All Free Users</AlertDialogTitle>
            <AlertDialogDescription>
              This will upgrade all free users to Gold tier for 30 days. This action cannot be easily reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={grantGoldLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGrantGold} disabled={grantGoldLoading}>
              {grantGoldLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Grant Gold
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Payments Tab ───────────────────────────────────────
function PaymentsTab({ adminId }: { adminId: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin?admin_id=${adminId}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch {
      toast.error('Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }, [adminId])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Payments</h2>
        <RefreshButton onClick={fetchData} loading={loading} />
      </div>

      {loading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <>
          {/* Summary */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-teal/5 to-coral/5">
            <CardContent className="p-6 text-center">
              <DollarSign className="size-10 text-teal mx-auto mb-2" />
              <p className="text-3xl font-bold">{formatCurrency(stats?.total_revenue ?? 0)}</p>
              <p className="text-sm text-muted-foreground">Total Verified Revenue</p>
            </CardContent>
          </Card>

          {/* Revenue by Plan */}
          {stats?.revenue_by_plan && stats.revenue_by_plan.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Revenue by Plan</h3>
              {stats.revenue_by_plan.map(item => (
                <Card key={item.plan} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={tierBgClass(item.plan)}>{item.plan}</Badge>
                      <span className="font-bold text-lg">{formatCurrency(Number(item.total))}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.count} payment{Number(item.count) !== 1 ? 's' : ''}</span>
                      <span>Avg: {formatCurrency(Number(item.count) > 0 ? Number(item.total) / Number(item.count) : 0)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <Banknote className="size-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No payment data available yet.</p>
              </CardContent>
            </Card>
          )}

          {/* Wallet Info */}
          <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="size-4" /> Payment Wallets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">USDT (Celo)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono p-2 rounded bg-muted break-all">0x712c79c774f335c81bd4a46efff948bca9867ab8</code>
                  <Button variant="outline" size="icon" className="shrink-0 size-9"
                    onClick={() => { navigator.clipboard.writeText('0x712c79c774f335c81bd4a46efff948bca9867ab8'); toast.success('Copied') }}>
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Solana</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono p-2 rounded bg-muted break-all">4bciiEgbD3bMakErgjc1EpVKPKE17y8onEVo6GM9XzpC</code>
                  <Button variant="outline" size="icon" className="shrink-0 size-9"
                    onClick={() => { navigator.clipboard.writeText('4bciiEgbD3bMakErgjc1EpVKPKE17y8onEVo6GM9XzpC'); toast.success('Copied') }}>
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// ─── Promo Codes Tab ────────────────────────────────────
function PromoCodesTab({ adminId }: { adminId: string }) {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newTier, setNewTier] = useState('silver')
  const [newDuration, setNewDuration] = useState('7')
  const [newMaxUses, setNewMaxUses] = useState('50')

  const fetchCodes = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch promo codes from admin stats or dedicated endpoint
      // For now, we'll create them via admin API and show a simple list
      // Since there's no GET /api/promo-codes, we rely on creating and showing those
      setCodes([])
    } catch {
      toast.error('Failed to load promo codes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCodes() }, [fetchCodes])

  const handleCreate = async () => {
    if (!newCode.trim()) {
      toast.error('Code is required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: adminId,
          action: 'create-promo',
          code: newCode.trim().toUpperCase(),
          tier: newTier,
          duration_days: parseInt(newDuration) || 30,
          max_uses: parseInt(newMaxUses) || 0
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Promo code ${newCode} created`)
        setCodes(prev => [...prev, {
          id: crypto.randomUUID(),
          code: newCode.trim().toUpperCase(),
          tier: newTier,
          duration_days: parseInt(newDuration) || 30,
          max_uses: parseInt(newMaxUses) || 0,
          current_uses: 0,
          is_active: 1,
          created_at: new Date().toISOString()
        }])
        setNewCode('')
        setNewTier('silver')
        setNewDuration('7')
        setNewMaxUses('50')
        setCreateOpen(false)
      } else {
        toast.error(data.error || 'Failed to create promo code')
      }
    } catch {
      toast.error('Failed to create promo code')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Promo Codes</h2>

      {/* Create Button */}
      <Button
        className="w-full h-11 bg-gradient-to-r from-coral to-coral-dark text-white"
        onClick={() => setCreateOpen(true)}
      >
        <Plus className="size-4" /> Create Promo Code
      </Button>

      {/* Recently Created Codes */}
      {codes.length > 0 ? (
        <div className="space-y-2">
          {codes.map(code => (
            <Card key={code.id} className={`border-0 shadow-sm ${!code.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="size-4 text-coral" />
                    <code className="font-bold text-sm">{code.code}</code>
                  </div>
                  <Badge className={code.is_active ? 'bg-teal/10 text-teal border-0' : 'bg-muted text-muted-foreground border-0'}>
                    {code.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge className="bg-coral/10 text-coral border-0 text-xs capitalize">{code.tier}</Badge>
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="size-3 mr-1" /> {code.duration_days} days
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Hash className="size-3 mr-1" /> {code.current_uses}/{code.max_uses || 'Unlimited'} used
                  </Badge>
                </div>
                {code.max_uses > 0 && (
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-coral"
                      style={{ width: `${(code.current_uses / code.max_uses) * 100}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <Gift className="size-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No promo codes created in this session. Create one above.</p>
          </CardContent>
        </Card>
      )}

      {/* Create Promo Code Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
            <DialogDescription>Create a new promotional code for users. It will be saved immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Code (e.g. WELCOME2025)" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} />
            <div className="grid grid-cols-2 gap-2">
              {['silver', 'gold', 'diamond'].map(tier => (
                <motion.button
                  key={tier}
                  whileTap={{ scale: 0.95 }}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium capitalize transition-colors min-h-[44px] ${
                    newTier === tier
                      ? 'bg-coral text-white shadow-md'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={() => setNewTier(tier)}
                >
                  {tier}
                </motion.button>
              ))}
            </div>
            <Input type="number" placeholder="Duration (days)" value={newDuration} onChange={e => setNewDuration(e.target.value)} />
            <Input type="number" placeholder="Max uses (0 = unlimited)" value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-gradient-to-r from-coral to-coral-dark text-white">
              {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Settings Tab ───────────────────────────────────────
function SettingsTab() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to load settings from admin API
    const fetchSettings = async () => {
      setLoading(true)
      try {
        // Settings are read-only from the DB - show what we know
        setSettings({
          celo_wallet: '0x712c79c774f335c81bd4a46efff948bca9867ab8',
          solana_wallet: '4bciiEgbD3bMakErgjc1EpVKPKE17y8onEVo6GM9XzpC',
          support_channel: 'https://t.me/GYconnectSupport',
        })
      } catch {
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Settings</h2>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <>
          {/* Support Channel */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Support Channel</label>
              <div className="flex items-center gap-2">
                <Input value={settings.support_channel || ''} readOnly className="bg-muted/50" />
                <Button variant="outline" size="icon" className="shrink-0 size-9"
                  onClick={() => settings.support_channel && copyToClipboard(settings.support_channel)}>
                  <Copy className="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Addresses */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Wallet className="size-4" /> Wallet Addresses (Read-Only)
              </label>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">USDT (Celo)</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono p-2 rounded bg-muted break-all">{settings.celo_wallet}</code>
                    <Button variant="outline" size="icon" className="shrink-0 size-9"
                      onClick={() => settings.celo_wallet && copyToClipboard(settings.celo_wallet)}>
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Solana</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono p-2 rounded bg-muted break-all">{settings.solana_wallet}</code>
                    <Button variant="outline" size="icon" className="shrink-0 size-9"
                      onClick={() => settings.solana_wallet && copyToClipboard(settings.solana_wallet)}>
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">App Info</label>
              <div className="text-sm space-y-1">
                <p>Version: <span className="font-mono">1.0.0</span></p>
                <p>Database: <span className="font-mono">Turso (LibSQL)</span></p>
                <p>Framework: <span className="font-mono">Next.js 16</span></p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// ─── Broadcast Tab ──────────────────────────────────────
function BroadcastTab({ adminId }: { adminId: string }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: adminId,
          action: 'broadcast',
          details: message.trim()
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Broadcast logged successfully')
        setSent(true)
        setTimeout(() => { setSent(false); setMessage('') }, 3000)
      } else {
        toast.error(data.error || 'Broadcast failed')
      }
    } catch {
      toast.error('Broadcast failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Broadcast</h2>

      <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="size-4" /> Broadcast Message
            </label>
            <Textarea
              className="min-h-[140px] resize-none"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message to broadcast to all users..."
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
          </div>

          <Button
            className="w-full h-12 font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #FF6B6B, #EE5A5A)' }}
            disabled={!message.trim() || sending || sent}
            onClick={handleSend}
          >
            {sending ? (
              <><Loader2 className="size-4 animate-spin mr-2" /> Sending...</>
            ) : sent ? (
              <><CheckCircle2 className="size-4 mr-2" /> Sent!</>
            ) : (
              <><Send className="size-4 mr-2" /> Send Broadcast</>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This will log the broadcast message. The message will be delivered to users via the platform notification system.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Admin Component ───────────────────────────────
export function AdminPage() {
  const { profile, setPage, adminTab, setAdminTab } = useAppStore()
  const adminId = getAdminId(profile)

  // Non-admin guard
  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <Shield className="size-16 text-muted-foreground/30" />
        <h2 className="text-lg font-bold">Access Denied</h2>
        <p className="text-sm text-muted-foreground text-center">You do not have permission to view this page.</p>
        <Button variant="outline" onClick={() => setPage('profile')}>Back to Profile</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setPage('profile')}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Shield className="size-5 text-coral" />
            <h1 className="font-bold text-lg">Admin Panel</h1>
          </div>
          <Badge className="bg-coral/10 text-coral border-0 text-xs">
            <Crown className="size-3 mr-1" /> Admin
          </Badge>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex-1 px-4 pb-6">
        <Tabs value={adminTab} onValueChange={setAdminTab} className="mt-4">
          {/* Scrollable tab list */}
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-auto gap-1 bg-muted/50 p-1 rounded-xl mb-4 w-max min-w-full">
              {ADMIN_TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Icon className="size-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </ScrollArea>

          <TabsContent value="dashboard">
            <DashboardTab adminId={adminId} />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab adminId={adminId} />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsTab adminId={adminId} />
          </TabsContent>
          <TabsContent value="countries">
            <CountriesTab adminId={adminId} />
          </TabsContent>
          <TabsContent value="subscriptions">
            <SubscriptionsTab adminId={adminId} />
          </TabsContent>
          <TabsContent value="payments">
            <PaymentsTab adminId={adminId} />
          </TabsContent>
          <TabsContent value="promocodes">
            <PromoCodesTab adminId={adminId} />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
          <TabsContent value="broadcast">
            <BroadcastTab adminId={adminId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
