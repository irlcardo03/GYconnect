'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Users, Plus, MessageCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'

interface Group {
  id: string
  name: string
  description: string
  country_code: string
  member_count: number
  is_default: number
}

export default function Groups() {
  const { profile, setActiveGroup, setPage } = useAppStore()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!profile?.country_code) return
    fetchGroups()
  }, [profile?.country_code])

  const fetchGroups = async () => {
    if (!profile?.country_code) return
    setLoading(true)
    try {
      const res = await fetch(`/api/groups?country_code=${profile.country_code}`)
      const data = await res.json()
      setGroups(data.groups || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim() || !profile?.country_code) return
    setCreating(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country_code: profile.country_code,
          name: newName.trim(),
          description: newDesc.trim(),
          created_by: profile.id,
        }),
      })
      const data = await res.json()
      if (data.group) {
        setGroups((prev) => [...prev, data.group as Group])
        setNewName('')
        setNewDesc('')
        setCreateOpen(false)
      }
    } catch {
      // silently fail
    } finally {
      setCreating(false)
    }
  }

  const handleOpenGroup = (group: Group) => {
    setActiveGroup(String(group.id))
    setPage('group-detail')
  }

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="flex items-center justify-between mb-6 px-2">
        <h1 className="text-2xl font-bold text-white">Groups</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="gap-1.5 text-white rounded-xl"
              style={{ backgroundColor: '#FF6B6B' }}
            >
              <Plus className="w-4 h-4" />
              Create
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Group name"
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 min-h-20"
              />
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="w-full text-white"
                style={{ backgroundColor: '#FF6B6B' }}
              >
                {creating ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8" style={{ color: '#FF6B6B' }} viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm">No groups in your area yet</p>
          <p className="text-gray-500 text-xs mt-1">Be the first to create one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group, i) => (
            <motion.button
              key={String(group.id)}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleOpenGroup(group)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white text-sm truncate">{String(group.name)}</h3>
                    {Number(group.is_default) === 1 && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: '#2DD4BF' }}
                      >
                        Default
                      </span>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-gray-400 text-xs line-clamp-2">{String(group.description)}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <Users className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-gray-400 text-xs">{Number(group.member_count) || 0}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
