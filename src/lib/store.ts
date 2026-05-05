import { create } from 'zustand'

export interface Profile {
  id: string
  telegram_id: string
  username: string
  first_name: string
  age: number | null
  country_code: string
  city_id: string
  position: string
  looking_for: string
  bio: string
  mood: string
  tags: string
  vibes: string
  subscription_tier: string
  subscription_expires_at: string | null
  profile_views: number
  streak: number
  is_banned: number
  is_admin: number
  created_at: string
}

export interface Chat {
  id: string
  type: string
  name: string
  otherProfile?: Profile
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  type: string
  is_read: number
  created_at: string
  disappears_at?: string
}

export interface DiscoverProfile {
  profile: Profile
  distance?: string
}

interface AppState {
  // Auth
  profile: Profile | null
  setProfile: (p: Profile | null) => void
  
  // Navigation
  currentPage: string
  setPage: (page: string) => void
  
  // Setup
  setupStep: number
  setSetupStep: (step: number) => void
  
  // Chat
  activeChat: Chat | null
  setActiveChat: (chat: Chat | null) => void
  activeGroup: string | null
  setActiveGroup: (id: string | null) => void
  
  // Dark mode
  isDark: boolean
  setIsDark: (dark: boolean) => void
  
  // Admin
  isAdminMode: boolean
  setAdminMode: (mode: boolean) => void
  
  // Loading states
  isLoading: boolean
  setLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  setProfile: (p) => set({ profile: p }),
  
  currentPage: 'splash',
  setPage: (page) => set({ currentPage: page }),
  
  setupStep: 1,
  setSetupStep: (step) => set({ setupStep: step }),
  
  activeChat: null,
  setActiveChat: (chat) => set({ activeChat: chat }),
  activeGroup: null,
  setActiveGroup: (id) => set({ activeGroup: id }),
  
  isDark: false,
  setIsDark: (dark) => set({ isDark: dark }),
  
  isAdminMode: false,
  setAdminMode: (mode) => set({ isAdminMode: mode }),
  
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}))
