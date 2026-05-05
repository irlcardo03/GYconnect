'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, ArrowLeft, ExternalLink } from 'lucide-react'
import { useAppStore } from '@/lib/store'

const PLANS = [
  {
    id: 'gold',
    name: 'Gold',
    price: '$2',
    period: '/mo',
    color: '#F59E0B',
    features: [
      'See who liked you',
      'Unlimited likes',
      '5 Super Likes per day',
      'Basic profile boosts',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '$4',
    period: '/mo',
    color: '#94A3B8',
    features: [
      'Everything in Gold',
      'Priority discovery',
      '10 Super Likes per day',
      'Advanced filters',
      'See who viewed you',
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    price: '$6',
    period: '/mo',
    color: '#2DD4BF',
    features: [
      'Everything in Platinum',
      'Unlimited Super Likes',
      'Weekly profile boost',
      'Incognito mode',
      'See who viewed you',
      'Priority support',
    ],
  },
]

export default function Subscription() {
  const { setPage, profile } = useAppStore()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  return (
    <div className="min-h-screen px-4 pt-6 pb-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setPage('profile')}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">Upgrade</h1>
        </div>

        {/* Current Plan Badge */}
        {profile?.subscription_tier && profile.subscription_tier !== 'free' && (
          <div className="mb-6 text-center">
            <Badge className="text-white border-0 text-sm px-4 py-1" style={{ backgroundColor: '#2DD4BF' }}>
              Current: {profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)}
            </Badge>
          </div>
        )}

        {/* Plan Cards */}
        <div className="space-y-4">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <button
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full text-left bg-gray-900 border rounded-2xl p-5 transition-all ${
                  selectedPlan === plan.id ? 'border-gray-600' : 'border-gray-800'
                }`}
                style={selectedPlan === plan.id ? { borderColor: plan.color } : {}}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5" style={{ color: plan.color }} />
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" style={{ color: plan.color }} />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Button
              onClick={() => setPage('payment')}
              className="w-full h-12 text-base font-semibold text-white rounded-xl"
              style={{ backgroundColor: '#FF6B6B' }}
            >
              Continue to Payment
            </Button>
          </motion.div>
        )}

        {/* Support Channel */}
        <div className="mt-8 text-center">
          <a
            href="https://t.me/+QAQB2vigDAlhOGFk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Need help? Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
