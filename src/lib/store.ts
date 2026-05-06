import { create } from 'zustand'

export type Page = 'welcome' | 'setup' | 'discover' | 'chat' | 'chat-detail' | 'groups' | 'group-detail' | 'profile' | 'matches' | 'admin' | 'subscription' | 'payment' | 'settings'

export interface Profile {
  id: string
  telegram_id: string
  first_name: string
  age: number | null
  country_code: string
  city_id: string | null
  city_name?: string
  country_name?: string
  country_flag?: string
  position: string
  looking_for: string
  bio: string
  mood: string
  tags: string[]
  vibes: string[]
  subscription_tier: string
  subscription_expires_at: string | null
  profile_views: number
  streak: number
  is_banned: boolean
  is_admin: boolean
  daily_chats_used: number
  daily_likes_used: number
  daily_photos_sent: number
  daily_voice_sent: number
  daily_super_likes_used: number
  daily_boost_used: number
  daily_rewind_used: number
  daily_reset: string
  created_at: string
  last_active: string
}

export interface ChatInfo {
  id: string
  otherProfile: Profile | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  type: 'text' | 'photo' | 'voice'
  mediaId?: string
  isRead: boolean
  createdAt: string
}

export interface GroupInfo {
  id: string
  country_code: string
  name: string
  description: string
  is_default: boolean
  member_count: number
}

export interface DiscoverProfile extends Profile {
  vibeMatch?: number
}

interface AppState {
  // Navigation
  currentPage: Page
  previousPage: Page | null
  
  // Auth
  profile: Profile | null
  isAuthenticated: boolean
  
  // Chat
  activeChatId: string | null
  activeChatProfile: Profile | null
  chats: ChatInfo[]
  messages: Message[]
  typingUsers: Map<string, boolean>
  
  // Groups
  activeGroupId: string | null
  groups: GroupInfo[]
  groupMessages: Message[]
  
  // Discover
  discoverProfiles: DiscoverProfile[]
  currentDiscoverIndex: number
  
  // Matches
  matches: Profile[]
  
  // Admin
  adminTab: string
  
  // Theme
  isDark: boolean
  
  // Setup
  setupStep: number
  
  // Actions
  setPage: (page: Page) => void
  setProfile: (profile: Profile | null) => void
  setActiveChat: (chatId: string | null, profile?: Profile | null) => void
  setChats: (chats: ChatInfo[]) => void
  addMessage: (message: Message) => void
  setMessages: (messages: Message[]) => void
  setTyping: (chatId: string, isTyping: boolean) => void
  setActiveGroup: (groupId: string | null) => void
  setGroups: (groups: GroupInfo[]) => void
  addGroupMessage: (message: Message) => void
  setGroupMessages: (messages: Message[]) => void
  setDiscoverProfiles: (profiles: DiscoverProfile[]) => void
  nextDiscoverProfile: () => void
  setMatches: (matches: Profile[]) => void
  setAdminTab: (tab: string) => void
  setIsDark: (isDark: boolean) => void
  setSetupStep: (step: number) => void
  updateProfile: (updates: Partial<Profile>) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: 'welcome',
  previousPage: null,
  profile: null,
  isAuthenticated: false,
  activeChatId: null,
  activeChatProfile: null,
  chats: [],
  messages: [],
  typingUsers: new Map(),
  activeGroupId: null,
  groups: [],
  groupMessages: [],
  discoverProfiles: [],
  currentDiscoverIndex: 0,
  matches: [],
  adminTab: 'dashboard',
  isDark: false,
  setupStep: 1,

  setPage: (page) => set((state) => ({ 
    previousPage: state.currentPage, 
    currentPage: page 
  })),
  
  setProfile: (profile) => set({ profile, isAuthenticated: !!profile }),
  
  setActiveChat: (chatId, profile) => set({ 
    activeChatId: chatId, 
    activeChatProfile: profile || null 
  }),
  
  setChats: (chats) => set({ chats }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  setMessages: (messages) => set({ messages }),
  
  setTyping: (chatId, isTyping) => set((state) => {
    const newTyping = new Map(state.typingUsers)
    if (isTyping) newTyping.set(chatId, true)
    else newTyping.delete(chatId)
    return { typingUsers: newTyping }
  }),
  
  setActiveGroup: (groupId) => set({ activeGroupId: groupId }),
  
  setGroups: (groups) => set({ groups }),
  
  addGroupMessage: (message) => set((state) => ({
    groupMessages: [...state.groupMessages, message]
  })),
  
  setGroupMessages: (messages) => set({ groupMessages: messages }),
  
  setDiscoverProfiles: (profiles) => set({ discoverProfiles: profiles, currentDiscoverIndex: 0 }),
  
  nextDiscoverProfile: () => set((state) => ({
    currentDiscoverIndex: state.currentDiscoverIndex + 1
  })),
  
  setMatches: (matches) => set({ matches }),
  
  setAdminTab: (tab) => set({ adminTab: tab }),
  
  setIsDark: (isDark) => set({ isDark }),
  
  setSetupStep: (step) => set({ setupStep: step }),
  
  updateProfile: (updates) => set((state) => ({
    profile: state.profile ? { ...state.profile, ...updates } : null
  })),
}))
