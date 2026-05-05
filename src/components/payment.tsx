'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Copy, Check, ExternalLink } from 'lucide-react'
import { useAppStore } from '@/lib/store'

const CELO_WALLET = '0x712c79c774f335c81Bd4A46EffF948bCa9867Ab8'
const SOLANA_WALLET = '4BCiiEGbD3bMakErgjc1EpVKPKE17y8onEVo6GM9XzpC'

const PLANS = [
  { id: 'gold', name: 'Gold', amount: 2 },
  { id: 'platinum', name: 'Platinum', amount: 4 },
  { id: 'diamond', name: 'Diamond', amount: 6 },
]

export default function Payment() {
  const { profile, setPage } = useAppStore()
  const [selectedPlan, setSelectedPlan] = useState('gold')
  const [network, setNetwork] = useState<'celo' | 'solana'>('celo')
  const [txid, setTxid] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const currentPlan = PLANS.find(p => p.id === selectedPlan)!
  const walletAddress = network === 'celo' ? CELO_WALLET : SOLANA_WALLET

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // fallback
    }
  }

  const handleSubmit = async () => {
    if (!profile?.id || !txid.trim()) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profile.id,
          txid: txid.trim(),
          network,
          amount: currentPlan.amount,
          plan: selectedPlan,
        }),
      })

      const data = await res.json()
      if (data.payment) {
        setSuccess(true)
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2DD4BF' }}>
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Payment Submitted</h2>
          <p className="text-gray-400 text-sm">We will verify your payment and activate your plan shortly.</p>
          <Button
            onClick={() => setPage('profile')}
            className="text-white rounded-xl mt-4"
            style={{ backgroundColor: '#FF6B6B' }}
          >
            Back to Profile
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setPage('subscription')}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">Payment</h1>
        </div>

        {/* Plan Selection */}
        <div className="mb-6">
          <label className="text-xs text-gray-500 mb-2 block">Select Plan</label>
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                  selectedPlan === plan.id
                    ? 'text-white'
                    : 'bg-gray-800/50 border border-gray-700 text-gray-300'
                }`}
                style={selectedPlan === plan.id ? { backgroundColor: '#FF6B6B' } : {}}
              >
                {plan.name}
                <br />
                <span className="text-xs font-normal opacity-80">${plan.amount}/mo</span>
              </button>
            ))}
          </div>
        </div>

        {/* Network Selection */}
        <div className="mb-6">
          <label className="text-xs text-gray-500 mb-2 block">Payment Network</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setNetwork('celo')}
              className={`py-3 rounded-xl text-sm font-medium transition-all ${
                network === 'celo'
                  ? 'text-white'
                  : 'bg-gray-800/50 border border-gray-700 text-gray-300'
              }`}
              style={network === 'celo' ? { backgroundColor: '#F59E0B' } : {}}
            >
              Celo USDT
            </button>
            <button
              onClick={() => setNetwork('solana')}
              className={`py-3 rounded-xl text-sm font-medium transition-all ${
                network === 'solana'
                  ? 'text-white'
                  : 'bg-gray-800/50 border border-gray-700 text-gray-300'
              }`}
              style={network === 'solana' ? { backgroundColor: '#2DD4BF' } : {}}
            >
              Solana
            </button>
          </div>
        </div>

        {/* Wallet Address */}
        <div className="mb-6">
          <label className="text-xs text-gray-500 mb-2 block">
            {network === 'celo' ? 'Celo USDT' : 'Solana'} Wallet Address
          </label>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-300 text-xs font-mono break-all mb-3">{walletAddress}</p>
            <Button
              onClick={() => handleCopy(walletAddress, network)}
              variant="outline"
              size="sm"
              className="gap-1.5 border-gray-700 text-gray-300 text-xs"
            >
              {copied === network ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy Address
                </>
              )}
            </Button>
          </div>
        </div>

        {/* TXID Input */}
        <div className="mb-6">
          <label className="text-xs text-gray-500 mb-2 block">Transaction ID (TXID)</label>
          <Input
            value={txid}
            onChange={(e) => setTxid(e.target.value)}
            placeholder="Paste your transaction ID here"
            className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
          />
          <p className="text-gray-500 text-xs mt-2">
            Send ${currentPlan.amount} USDT via {network === 'celo' ? 'Celo' : 'Solana'} network, then paste the TXID above
          </p>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!txid.trim() || submitting}
          className="w-full h-12 text-base font-semibold text-white rounded-xl"
          style={{ backgroundColor: '#FF6B6B' }}
        >
          {submitting ? 'Submitting...' : 'Verify Payment'}
        </Button>

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
