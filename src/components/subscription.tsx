'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check, X, Crown, Star, Diamond, Coins,
  ArrowLeft, Sparkles, MessageSquare, Eye, Heart,
  Zap, Shield, ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  id: string
  name: string
  tagline: string
  price: string
  priceNote: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  features: PlanFeature[]
  highlights: string[]
  gradient?: string
  recommended?: boolean
  borderGradient?: string
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'The Teaser',
    price: '$0',
    priceNote: 'forever',
    icon: Sparkles,
    iconColor: 'text-teal',
    iconBg: 'bg-teal/10',
    highlights: ['5 chats/day', '10 likes/day', 'Basic discovery'],
    features: [
      { text: '5 chats per day', included: true },
      { text: '10 likes per day', included: true },
      { text: 'Basic discovery', included: true },
      { text: '1 super like per day', included: false },
      { text: 'See who liked you', included: false },
      { text: 'Unlimited chats', included: false },
      { text: 'Profile boost', included: false },
      { text: 'Rewind last swipe', included: false },
      { text: 'Voice messages', included: false },
      { text: 'Photo sharing in chat', included: false },
      { text: 'Priority support', included: false },
      { text: 'Incognito mode', included: false },
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    tagline: 'The Connector',
    price: '$2',
    priceNote: '/month',
    icon: Coins,
    iconColor: 'text-gray-400',
    iconBg: 'bg-gray-400/10',
    highlights: ['20 chats/day', 'Unlimited likes', '3 super likes'],
    features: [
      { text: '20 chats per day', included: true },
      { text: 'Unlimited likes', included: true },
      { text: '3 super likes per day', included: true },
      { text: 'See who liked you', included: true },
      { text: 'Voice messages', included: true },
      { text: 'Unlimited chats', included: false },
      { text: 'Profile boost', included: false },
      { text: 'Rewind last swipe', included: false },
      { text: 'Photo sharing in chat', included: false },
      { text: 'Priority support', included: false },
      { text: 'Incognito mode', included: false },
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    tagline: 'The Explorer',
    price: '$4',
    priceNote: '/month',
    icon: Star,
    iconColor: 'text-gold-dark',
    iconBg: 'bg-gold/15',
    recommended: true,
    borderGradient: 'linear-gradient(135deg, #FF6B6B, #FFD93D)',
    highlights: ['Unlimited chats', '5 super likes', 'Profile boost'],
    features: [
      { text: 'Unlimited chats', included: true },
      { text: 'Unlimited likes', included: true },
      { text: '5 super likes per day', included: true },
      { text: 'See who liked you', included: true },
      { text: 'Voice messages', included: true },
      { text: 'Photo sharing in chat', included: true },
      { text: 'Profile boost (1x/day)', included: true },
      { text: 'Rewind last swipe', included: true },
      { text: 'Priority support', included: false },
      { text: 'Incognito mode', included: false },
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    tagline: 'The King',
    price: '$6',
    priceNote: '/month',
    icon: Diamond,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-400/10',
    borderGradient: 'linear-gradient(135deg, #2DD4BF, #FFD93D, #FF6B6B)',
    highlights: ['All Gold features', '10 super likes', 'Incognito mode'],
    features: [
      { text: 'Unlimited chats', included: true },
      { text: 'Unlimited likes', included: true },
      { text: '10 super likes per day', included: true },
      { text: 'See who liked you', included: true },
      { text: 'Voice messages', included: true },
      { text: 'Photo sharing in chat', included: true },
      { text: 'Profile boost (3x/day)', included: true },
      { text: 'Rewind last swipe', included: true },
      { text: 'Priority support', included: true },
      { text: 'Incognito mode', included: true },
    ],
  },
]

function PlanCard({ plan, isCurrent, onSelect }: { plan: Plan; isCurrent: boolean; onSelect: () => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: PLANS.indexOf(plan) * 0.1 }}
    >
      <Card
        className="relative overflow-hidden border-0 shadow-lg"
        style={plan.borderGradient ? {
          border: '2px solid transparent',
          backgroundImage: `${plan.borderGradient}, var(--color-card)`,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, padding-box',
        } : {}}
      >
        {/* Recommended Badge */}
        {plan.recommended && (
          <div
            className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-xl"
            style={{ background: 'linear-gradient(135deg, #FF6B6B, #FFD93D)' }}
          >
            Most Popular
          </div>
        )}

        <CardContent className="p-5 space-y-4">
          {/* Plan Header */}
          <div className="flex items-start gap-3">
            <div className={`size-12 rounded-xl ${plan.iconBg} flex items-center justify-center shrink-0`}>
              <plan.icon className={`size-6 ${plan.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                {isCurrent && (
                  <Badge className="bg-teal/10 text-teal border-0 text-xs">Current Plan</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{plan.tagline}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold gradient-text">{plan.price}</p>
              <p className="text-xs text-muted-foreground">{plan.priceNote}</p>
            </div>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap gap-1.5">
            {plan.highlights.map(h => (
              <span
                key={h}
                className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium"
              >
                {h}
              </span>
            ))}
          </div>

          {/* Expand toggle */}
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {expanded ? 'Show less' : 'See all features'}
          </button>

          {/* Full Feature List */}
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-2"
            >
              {plan.features.map((feature) => (
                <div key={feature.text} className="flex items-center gap-2.5">
                  {feature.included ? (
                    <Check className="size-4 text-teal shrink-0" />
                  ) : (
                    <X className="size-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={`text-sm ${feature.included ? '' : 'text-muted-foreground/60 line-through'}`}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Select Button */}
          <Button
            className={`w-full min-h-[44px] font-semibold ${
              isCurrent
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : plan.recommended
                  ? 'text-white shadow-lg'
                  : plan.id === 'diamond'
                    ? 'bg-gradient-to-r from-teal to-cyan-400 text-white'
                    : 'bg-gradient-to-r from-coral to-coral-dark text-white'
            }`}
            style={plan.recommended && !isCurrent ? { background: 'linear-gradient(135deg, #FF6B6B, #FFD93D)' } : {}}
            disabled={isCurrent}
            onClick={onSelect}
          >
            {isCurrent ? 'Current Plan' : 'Select Plan'}
            {!isCurrent && <ArrowRight className="size-4 ml-1" />}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function SubscriptionPage() {
  const { profile, setPage } = useAppStore()
  const currentTier = profile?.subscription_tier || 'free'

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') return
    // Navigate to payment with selected plan
    setPage('payment')
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setPage('profile')}
            className="size-10 rounded-xl bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="size-5" />
          </motion.button>
          <div>
            <h1 className="font-bold text-lg">Choose Your Plan</h1>
          </div>
        </div>
      </div>

      {/* Safety Framing */}
      <div
        className="mx-4 mt-4 p-4 rounded-xl"
        style={{ background: 'linear-gradient(135deg, rgba(45,212,191,0.1), rgba(45,212,191,0.05))' }}
      >
        <div className="flex items-start gap-3">
          <Shield className="size-5 text-teal shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-teal">Your safety matters</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Premium keeps scammers away. Your safety is worth it.
            </p>
          </div>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="space-y-4 px-4 mt-5">
        {PLANS.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={currentTier === plan.id}
            onSelect={() => handleSelectPlan(plan.id)}
          />
        ))}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground mt-6 px-8">
        All payments are processed securely via cryptocurrency. Subscriptions auto-renew monthly. Cancel anytime.
      </p>
    </div>
  )
}
