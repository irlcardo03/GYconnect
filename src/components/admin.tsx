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
  ArrowLeft,
  Users,
  Shield,
  Globe,
  Building,
  MessageSquare,
  Flag,
  Ticket,
  CreditCard,
  ToggleLeft,
  Crown,
  Search,
  Ban,
  CheckCircle,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

type AdminTab = 'stats' | 'users' | 'locations' | 'groups' | 'reports' | 'payments' | 'promo' | 'freemium' | 'grant'

export default function Admin() {
  const { setPage } = useAppStore()
  const [activeTab, setActiveTab] = useState<AdminTab>('stats')
  const [loading, setLoading] = useState(false)

  // Stats
  const [stats, setStats] = useState<any>(null)

  // Users
  const [users, setUsers] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)

  // Locations
  const [countries, setCountries] = useState<any[]>([])
  const [newCountryName, setNewCountryName] = useState('')
  const [newCountryCode, setNewCountryCode] = useState('')
  const [newCountryFlag, setNewCountryFlag] = useState('')
  const [newCountryId, setNewCountryId] = useState('')
  const [cityCountryCode, setCityCountryCode] = useState('')
  const [cityNames, setCityNames] = useState('')

  // Reports
  const [reports, setReports] = useState<any[]>([])

  // Payments
  const [payments, setPayments] = useState<any[]>([])

  // Promo
  const [promoCode, setPromoCode] = useState('')
  const [promoTier, setPromoTier] = useState('gold')
  const [promoDays, setPromoDays] = useState('30')

  // Grant premium
  const [grantProfileId, setGrantProfileId] = useState('')
  const [grantTier, setGrantTier] = useState('gold')
  const [grantDays, setGrantDays] = useState('30')

  // Freemium
  const [freemiumMode, setFreemiumMode] = useState('false')

  useEffect(() => {
    fetchAdminData()
  }, [activeTab])

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'stats') {
        const res = await fetch('/api/admin?action=stats')
        const data = await res.json()
        setStats(data.stats)
      } else if (activeTab === 'users') {
        const res = await fetch(`/api/admin?action=users&page=${userPage}&limit=50`)
        const data = await res.json()
        setUsers(data.users || [])
      } else if (activeTab === 'reports') {
        const res = await fetch('/api/admin?action=reports')
        const data = await res.json()
        setReports(data.reports || [])
      } else if (activeTab === 'payments') {
        const res = await fetch('/api/admin?action=payments')
        const data = await res.json()
        setPayments(data.payments || [])
      } else if (activeTab === 'locations') {
        const res = await fetch('/api/countries')
        const data = await res.json()
        setCountries(data.countries || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const adminPost = async (action: string, params: any = {}) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        fetchAdminData()
      }
      return data
    } catch {
      alert('Request failed')
      return null
    }
  }

  const handleAddCountry = async () => {
    if (!newCountryId.trim() || !newCountryName.trim() || !newCountryCode.trim()) return
    await adminPost('add_country', {
      id: newCountryId.trim(),
      name: newCountryName.trim(),
      code: newCountryCode.trim(),
      flag: newCountryFlag.trim(),
    })
    setNewCountryId('')
    setNewCountryName('')
    setNewCountryCode('')
    setNewCountryFlag('')
  }

  const handleAddCities = async () => {
    if (!cityCountryCode || !cityNames.trim()) return
    const names = cityNames.trim().split('\n').map(n => n.trim()).filter(n => n.length > 0)
    if (names.length === 0) return
    await adminPost('add_cities', { country_code: cityCountryCode, names })
    setCityNames('')
  }

  const handleToggleFreemium = async () => {
    const data = await adminPost('toggle_freemium')
    if (data?.freemium_mode) setFreemiumMode(data.freemium_mode)
  }

  const handleGrantPremium = async () => {
    if (!grantProfileId.trim()) return
    await adminPost('grant_premium', {
      profile_id: grantProfileId.trim(),
      tier: grantTier,
      days: parseInt(grantDays),
    })
    setGrantProfileId('')
  }

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'stats', label: 'Stats', icon: Users },
    { id: 'users', label: 'Users', icon: Shield },
    { id: 'locations', label: 'Locations', icon: Globe },
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'promo', label: 'Promo', icon: Ticket },
    { id: 'grant', label: 'Grant', icon: Crown },
    { id: 'freemium', label: 'Freemium', icon: ToggleLeft },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-10">
        <button
          onClick={() => setPage('profile')}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-white">Admin Panel</h1>
        <Badge className="text-white border-0 text-xs ml-auto" style={{ backgroundColor: '#FF6B6B' }}>
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      </div>

      {/* Tab Navigation */}
      <div className="overflow-x-auto border-b border-gray-800 px-2">
        <div className="flex gap-1 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
                style={isActive ? { backgroundColor: '#FF6B6B30', color: '#FF6B6B' } : {}}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8" style={{ color: '#FF6B6B' }} viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <>
            {/* STATS */}
            {activeTab === 'stats' && stats && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Users', value: stats.total_users, color: '#FF6B6B' },
                  { label: 'New Today', value: stats.new_today, color: '#2DD4BF' },
                  { label: 'Active (7d)', value: stats.active, color: '#F59E0B' },
                  { label: 'Pending Reports', value: stats.reports_count, color: '#EF4444' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* USERS */}
            {activeTab === 'users' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users..."
                      className="pl-10 h-9 bg-gray-800/50 border-gray-700 text-white text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users
                    .filter((u) => {
                      if (!userSearch) return true
                      const s = userSearch.toLowerCase()
                      return (
                        String(u.username || '').toLowerCase().includes(s) ||
                        String(u.first_name || '').toLowerCase().includes(s) ||
                        String(u.id).toLowerCase().includes(s)
                      )
                    })
                    .map((user) => (
                      <div key={String(user.id)} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-gray-400">
                            {String(user.first_name || user.username || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {String(user.first_name || user.username || 'Unknown')}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{String(user.username || '')} | {String(user.subscription_tier || 'free')}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {Number(user.is_banned) === 1 ? (
                            <Button
                              onClick={() => adminPost('unban_user', { profile_id: String(user.id) })}
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 border-green-800 text-green-400"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Unban
                            </Button>
                          ) : (
                            <Button
                              onClick={() => adminPost('ban_user', { profile_id: String(user.id) })}
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 border-red-800 text-red-400"
                            >
                              <Ban className="w-3 h-3" />
                              Ban
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* LOCATIONS */}
            {activeTab === 'locations' && (
              <div className="space-y-6">
                {/* Add Country */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4" style={{ color: '#2DD4BF' }} />
                    Add Country
                  </h3>
                  <div className="space-y-2">
                    <Input value={newCountryId} onChange={(e) => setNewCountryId(e.target.value)} placeholder="Country ID (e.g. gh)" className="h-9 bg-gray-800/50 border-gray-700 text-white text-sm" />
                    <Input value={newCountryName} onChange={(e) => setNewCountryName(e.target.value)} placeholder="Country name" className="h-9 bg-gray-800/50 border-gray-700 text-white text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={newCountryCode} onChange={(e) => setNewCountryCode(e.target.value)} placeholder="Code (e.g. GH)" className="h-9 bg-gray-800/50 border-gray-700 text-white text-sm" />
                      <Input value={newCountryFlag} onChange={(e) => setNewCountryFlag(e.target.value)} placeholder="Flag emoji" className="h-9 bg-gray-800/50 border-gray-700 text-white text-sm" />
                    </div>
                    <Button onClick={handleAddCountry} size="sm" className="w-full text-white" style={{ backgroundColor: '#2DD4BF' }}>
                      Add Country
                    </Button>
                  </div>
                </div>

                {/* Add Cities (batch) */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4" style={{ color: '#F59E0B' }} />
                    Add Cities (Batch)
                  </h3>
                  <div className="space-y-2">
                    <Select value={cityCountryCode} onValueChange={setCityCountryCode}>
                      <SelectTrigger className="h-9 bg-gray-800/50 border-gray-700 text-white text-sm">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 max-h-64">
                        {countries.map((c: any) => (
                          <SelectItem key={String(c.code)} value={String(c.code)} className="text-white focus:bg-gray-700 focus:text-white">
                            {String(c.flag || '')} {String(c.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={cityNames}
                      onChange={(e) => setCityNames(e.target.value)}
                      placeholder="One city per line..."
                      className="bg-gray-800/50 border-gray-700 text-white text-sm min-h-32"
                    />
                    <p className="text-xs text-gray-500">Enter one city name per line. All cities will be added to the selected country.</p>
                    <Button onClick={handleAddCities} size="sm" className="w-full text-white" style={{ backgroundColor: '#F59E0B' }}>
                      Add Cities
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* REPORTS */}
            {activeTab === 'reports' && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {reports.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-10">No reports</p>
                ) : (
                  reports.map((report) => (
                    <div key={String(report.id)} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Report #{String(report.id).slice(0, 8)}</span>
                        <Badge className={`text-xs border-0 ${String(report.status) === 'pending' ? 'bg-yellow-600' : 'bg-green-600'} text-white`}>
                          {String(report.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-white">{String(report.reason || 'No reason')}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          onClick={() => adminPost('resolve_report', { report_id: String(report.id), resolution: 'resolved' })}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-green-800 text-green-400"
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* PAYMENTS */}
            {activeTab === 'payments' && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {payments.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-10">No payments</p>
                ) : (
                  payments.map((payment) => (
                    <div key={String(payment.id)} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-medium capitalize">{String(payment.plan)}</span>
                        <Badge className={`text-xs border-0 ${String(payment.status) === 'pending' ? 'bg-yellow-600' : 'bg-green-600'} text-white`}>
                          {String(payment.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">TXID: {String(payment.txid || '').slice(0, 20)}...</p>
                      <p className="text-xs text-gray-500">Network: {String(payment.network)} | ${Number(payment.amount)}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* PROMO */}
            {activeTab === 'promo' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Ticket className="w-4 h-4" style={{ color: '#FF6B6B' }} />
                  Create Promo Code
                </h3>
                <div className="space-y-2">
                  <Input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo code"
                    className="h-9 bg-gray-800/50 border-gray-700 text-white text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={promoTier} onValueChange={setPromoTier}>
                      <SelectTrigger className="h-9 bg-gray-800/50 border-gray-700 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="gold" className="text-white">Gold</SelectItem>
                        <SelectItem value="platinum" className="text-white">Platinum</SelectItem>
                        <SelectItem value="diamond" className="text-white">Diamond</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={promoDays}
                      onChange={(e) => setPromoDays(e.target.value)}
                      placeholder="Days"
                      type="number"
                      className="h-9 bg-gray-800/50 border-gray-700 text-white text-sm"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      if (!promoCode.trim()) return
                      await adminPost('add_promo', { code: promoCode.trim(), tier: promoTier, duration_days: parseInt(promoDays) || 30, max_uses: 0 })
                      setPromoCode('')
                    }}
                    size="sm"
                    className="w-full text-white"
                    style={{ backgroundColor: '#FF6B6B' }}
                  >
                    Create Promo Code
                  </Button>
                </div>
              </div>
            )}

            {/* GRANT PREMIUM */}
            {activeTab === 'grant' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Crown className="w-4 h-4" style={{ color: '#F59E0B' }} />
                  Grant Premium to User
                </h3>
                <div className="space-y-2">
                  <Input
                    value={grantProfileId}
                    onChange={(e) => setGrantProfileId(e.target.value)}
                    placeholder="User Profile ID"
                    className="h-9 bg-gray-800/50 border-gray-700 text-white text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={grantTier} onValueChange={setGrantTier}>
                      <SelectTrigger className="h-9 bg-gray-800/50 border-gray-700 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="gold" className="text-white">Gold</SelectItem>
                        <SelectItem value="platinum" className="text-white">Platinum</SelectItem>
                        <SelectItem value="diamond" className="text-white">Diamond</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={grantDays}
                      onChange={(e) => setGrantDays(e.target.value)}
                      placeholder="Days"
                      type="number"
                      className="h-9 bg-gray-800/50 border-gray-700 text-white text-sm"
                    />
                  </div>
                  <Button onClick={handleGrantPremium} size="sm" className="w-full text-white" style={{ backgroundColor: '#F59E0B' }}>
                    Grant Premium
                  </Button>
                </div>
              </div>
            )}

            {/* FREEMIUM */}
            {activeTab === 'freemium' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <h3 className="text-sm font-semibold text-white mb-3">Freemium Mode</h3>
                <p className="text-gray-400 text-sm mb-4">
                  When enabled, all users get basic premium features for free.
                </p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-gray-500 text-sm">Current:</span>
                  <Badge className={`text-white border-0 ${freemiumMode === 'true' ? 'bg-green-600' : 'bg-gray-600'}`}>
                    {freemiumMode === 'true' ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <Button
                  onClick={handleToggleFreemium}
                  className="text-white"
                  style={{ backgroundColor: freemiumMode === 'true' ? '#EF4444' : '#2DD4BF' }}
                >
                  <ToggleLeft className="w-4 h-4 mr-2" />
                  {freemiumMode === 'true' ? 'Disable Freemium' : 'Enable Freemium'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
