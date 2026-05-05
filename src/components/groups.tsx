'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Users,
  Plus,
  Crown,
  Star,
  Globe,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAppStore, GroupInfo } from '@/lib/store'

const GROUP_COLORS = [
  'from-coral/80 to-[#FF8E6B]/80',
  'from-teal/80 to-teal-dark/80',
  'from-violet-400/80 to-purple-500/80',
  'from-amber-400/80 to-orange-500/80',
  'from-emerald-400/80 to-green-500/80',
  'from-pink-400/80 to-rose-500/80',
]

function getGroupColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length]
}

interface EnrichedGroup extends GroupInfo {
  is_member?: boolean
  country_flag?: string
}

export default function Groups() {
  const { profile, groups, setGroups, setActiveGroup, setPage } = useAppStore()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [enrichedGroups, setEnrichedGroups] = useState<EnrichedGroup[]>([])
  const [joinLoading, setJoinLoading] = useState<string | null>(null)

  const fetchGroups = useCallback(async () => {
    if (!profile?.country_code) return
    try {
      const res = await fetch(
        `/api/groups?country_code=${profile.country_code}&profile_id=${profile.id}`
      )
      const data = await res.json()
      if (data.groups) {
        const groupInfos: EnrichedGroup[] = data.groups.map((g: any) => ({
          id: g.id,
          country_code: g.country_code,
          name: g.name,
          description: g.description || '',
          is_default: Boolean(g.is_default),
          member_count: Number(g.member_count || 0),
          is_member: Boolean(g.is_member),
          country_flag: profile.country_flag || '',
        }))
        setGroups(
          groupInfos.map(({ is_member, country_flag, ...g }) => g)
        )
        setEnrichedGroups(groupInfos)
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [profile?.country_code, profile?.id, profile?.country_flag, setGroups])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchGroups()
  }

  const handleJoinGroup = async (group: EnrichedGroup) => {
    if (!profile?.id) return
    if (group.is_member) {
      // Navigate to group detail
      setActiveGroup(group.id)
      setPage('group-detail')
      return
    }

    setJoinLoading(group.id)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          group_id: group.id,
          profile_id: profile.id,
        }),
      })

      if (res.ok) {
        // Update local state
        setEnrichedGroups((prev) =>
          prev.map((g) =>
            g.id === group.id
              ? {
                  ...g,
                  is_member: true,
                  member_count: g.member_count + 1,
                }
              : g
          )
        )
        setActiveGroup(group.id)
        setPage('group-detail')
      }
    } catch (err) {
      console.error('Failed to join group:', err)
    } finally {
      setJoinLoading(null)
    }
  }

  const handleCreateGroup = async () => {
    if (!profile?.id || !profile?.country_code || !newGroupName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDesc.trim(),
          country_code: profile.country_code,
          created_by: profile.id,
        }),
      })

      if (res.ok) {
        setCreateOpen(false)
        setNewGroupName('')
        setNewGroupDesc('')
        fetchGroups()
      }
    } catch (err) {
      console.error('Failed to create group:', err)
    } finally {
      setCreating(false)
    }
  }

  const filteredGroups = enrichedGroups.filter((g) => {
    if (!search) return true
    return g.name.toLowerCase().includes(search.toLowerCase())
  })

  const isGold = profile?.subscription_tier === 'gold'
  const defaultGroup = filteredGroups.find((g) => g.is_default)
  const otherGroups = filteredGroups.filter((g) => !g.is_default)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="safe-top px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-foreground">Groups</h1>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleRefresh}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              disabled={refreshing}
            >
              <RefreshCw
                className={`size-5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`}
              />
            </motion.button>

            {/* Create Group */}
            {isGold ? (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-coral to-[#FF8E6B] text-white rounded-xl shadow-sm shadow-coral/20 gap-1.5"
                  >
                    <Plus className="size-4" />
                    Create
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[340px] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Create a Group</DialogTitle>
                    <DialogDescription>
                      Start a new community in your country
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 mt-2">
                    <Input
                      placeholder="Group name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      className="rounded-xl"
                    />
                    <Button
                      onClick={handleCreateGroup}
                      disabled={!newGroupName.trim() || creating}
                      className="w-full bg-gradient-to-r from-coral to-[#FF8E6B] text-white rounded-xl"
                    >
                      {creating ? 'Creating...' : 'Create Group'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl gap-1.5 text-xs"
                onClick={() =>
                  setPage('subscription')
                }
              >
                <Crown className="size-3.5 text-gold" />
                <span className="text-muted-foreground">Upgrade to create</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-coral/30"
          />
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-muted shimmer animate-pulse"
              />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
          >
            <div className="size-20 rounded-full bg-muted/60 flex items-center justify-center mb-4">
              <Users className="size-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No groups found
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {search
                ? 'Try a different search term'
                : 'Groups for your country will appear here'}
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {/* Default Community Group */}
            {defaultGroup && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <div className="relative overflow-hidden rounded-2xl border-2 border-coral/20 bg-gradient-to-br from-coral/5 to-[#FF8E6B]/5 dark:from-coral/10 dark:to-[#FF8E6B]/10">
                  {/* Default badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-gradient-to-r from-coral to-[#FF8E6B] text-white text-[10px] px-2 py-0 h-5 rounded-full border-0">
                      <Star className="size-3 mr-1" />
                      Community
                    </Badge>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Group icon */}
                      <div
                        className={`size-12 rounded-xl bg-gradient-to-br ${getGroupColor(
                          defaultGroup.name
                        )} flex items-center justify-center text-white shrink-0 shadow-sm`}
                      >
                        <Globe className="size-6" />
                      </div>

                      <div className="flex-1 min-w-0 pr-16">
                        <h3 className="font-semibold text-foreground text-sm truncate">
                          {defaultGroup.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {defaultGroup.description || 'The main community group'}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Users className="size-3" />
                            {defaultGroup.member_count} members
                          </span>
                          {defaultGroup.country_flag && (
                            <span className="text-sm">
                              {defaultGroup.country_flag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Join/Enter button */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleJoinGroup(defaultGroup)}
                      disabled={joinLoading === defaultGroup.id}
                      className={`w-full mt-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        defaultGroup.is_member
                          ? 'bg-muted/60 text-foreground hover:bg-muted/80'
                          : 'bg-gradient-to-r from-coral to-[#FF8E6B] text-white shadow-sm shadow-coral/20'
                      }`}
                    >
                      {joinLoading === defaultGroup.id ? (
                        <RefreshCw className="size-4 animate-spin" />
                      ) : defaultGroup.is_member ? (
                        <>
                          <CheckCircle2 className="size-4 text-teal" />
                          Enter Chat
                        </>
                      ) : (
                        'Join Community'
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Other Groups */}
            {otherGroups.map((group, i) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.03 }}
              >
                <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Group icon */}
                      <div
                        className={`size-11 rounded-xl bg-gradient-to-br ${getGroupColor(
                          group.name
                        )} flex items-center justify-center text-white shrink-0 shadow-sm`}
                      >
                        <Users className="size-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground text-sm truncate">
                            {group.name}
                          </h3>
                          {group.is_member && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4 rounded-full bg-teal/10 text-teal-dark dark:text-teal shrink-0 border-0"
                            >
                              Joined
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {group.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Users className="size-3" />
                            {group.member_count} members
                          </span>
                          {group.country_flag && (
                            <span className="text-sm">
                              {group.country_flag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Join/Enter button */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleJoinGroup(group)}
                      disabled={joinLoading === group.id}
                      className={`w-full mt-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        group.is_member
                          ? 'bg-muted/60 text-foreground hover:bg-muted/80'
                          : 'bg-gradient-to-r from-teal to-teal-dark text-white shadow-sm shadow-teal/20'
                      }`}
                    >
                      {joinLoading === group.id ? (
                        <RefreshCw className="size-4 animate-spin" />
                      ) : group.is_member ? (
                        <>
                          <CheckCircle2 className="size-4 text-teal" />
                          Enter Chat
                        </>
                      ) : (
                        'Join Group'
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
