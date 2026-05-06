'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Copy, Check, AlertCircle, ExternalLink,
  Loader2, CheckCircle2, XCircle, HelpCircle, Wallet,
  Shield, ArrowRight, Clock
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'

const PLAN_PRICES: Record<string, number> = {
  silver: 2.00,
  gold: 4.00,
  diamond: 6.00,
}

const PLAN_NAMES: Record<string, string> = {
  silver: 'Silver - The Connector',
  gold: 'Gold - The Explorer',
  diamond: 'Diamond - The King',
}

interface PaymentMethod {
  id: string
  name: string
  network: string
  recommended?: string
  walletAddress: string
  currency: string
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'usdt-celo',
    name: 'USDT',
    network: 'Celo Network',
    recommended: 'Africa',
    walletAddress: '0x712c79c774f335c81Bd4A46EffF948bCa9867Ab8',
    currency: 'USDT',
  },
  {
    id: 'solana',
    name: 'Solana',
    network: 'SOL/USDT',
    recommended: 'India & Philippines',
    walletAddress: '4BCiiEGbD3bMakErgjc1EpVKPKE17y8onEVo6GM9XzpC',
    currency: 'SOL',
  },
]

type VerificationStatus = 'idle' | 'pending' | 'success' | 'failed'

export function PaymentPage() {
  const { profile, setPage } = useAppStore()
  const selectedPlan = profile?.subscription_tier === 'free' ? 'gold' : 'diamond'
  const price = PLAN_PRICES[selectedPlan] || 4.00

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [txid, setTxid] = useState('')
  const [verifyStatus, setVerifyStatus] = useState<VerificationStatus>('idle')
  const [failReason, setFailReason] = useState('')
  const [copiedAddress, setCopiedAddress] = useState(false)

  const currentMethod = PAYMENT_METHODS.find(m => m.id === selectedMethod)

  const handleCopyAddress = () => {
    if (currentMethod) {
      navigator.clipboard.writeText(currentMethod.walletAddress)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  const handleVerify = async () => {
    if (!txid.trim()) return

    setVerifyStatus('pending')
    setFailReason('')

    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txid: txid.trim(),
          network: selectedMethod === 'usdt-celo' ? 'celo' : 'solana',
          plan: selectedPlan,
          amount: price,
          profile_id: profile?.id,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setVerifyStatus('success')
      } else {
        setVerifyStatus('failed')
        setFailReason(data.error || 'Transaction could not be verified. Please try again.')
      }
    } catch {
      setVerifyStatus('failed')
      setFailReason('Network error. Please check your connection and try again.')
    }
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setPage('subscription')}
            className="size-10 rounded-xl bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="size-5" />
          </motion.button>
          <div>
            <h1 className="font-bold text-lg">Payment</h1>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5 mt-4">
        {/* Selected Plan */}
        <Card
          className="border-0 shadow-lg overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #FF6B6B, #FFD93D)' }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Selected Plan</p>
                <p className="text-white font-bold text-lg">{PLAN_NAMES[selectedPlan] || 'Gold Plan'}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-3xl">${price.toFixed(2)}</p>
                <p className="text-white/80 text-xs">per month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Payment Method */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="size-6 rounded-full bg-coral text-white text-xs font-bold flex items-center justify-center">1</span>
            <h3 className="font-semibold">Select Payment Method</h3>
          </div>

          <div className="space-y-3">
            {PAYMENT_METHODS.map(method => (
              <motion.button
                key={method.id}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left rounded-xl p-4 transition-all border-2 min-h-[44px] ${
                  selectedMethod === method.id
                    ? 'border-coral bg-coral/5 shadow-md'
                    : 'border-transparent bg-card shadow-sm hover:shadow-md'
                }`}
                onClick={() => {
                  setSelectedMethod(method.id)
                  setVerifyStatus('idle')
                  setTxid('')
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                      <Wallet className="size-5 text-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{method.name}</span>
                        <span className="text-xs text-muted-foreground">({method.network})</span>
                      </div>
                      {method.recommended && (
                        <p className="text-xs text-teal font-medium">
                          Recommended for {method.recommended}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === method.id ? 'border-coral bg-coral' : 'border-muted-foreground/30'
                  }`}>
                    {selectedMethod === method.id && (
                      <Check className="size-3 text-white" />
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Step 2: Wallet Address & Instructions */}
        {selectedMethod && currentMethod && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-full bg-coral text-white text-xs font-bold flex items-center justify-center">2</span>
              <h3 className="font-semibold">Send Payment</h3>
            </div>

            {/* Wallet Address */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Send {currentMethod.currency} to this address
                </p>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <code className="flex-1 text-xs font-mono break-all leading-relaxed">
                    {currentMethod.walletAddress}
                  </code>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCopyAddress}
                    className="size-9 rounded-lg bg-card flex items-center justify-center shrink-0 shadow-sm"
                  >
                    {copiedAddress ? (
                      <Check className="size-4 text-teal" />
                    ) : (
                      <Copy className="size-4 text-muted-foreground" />
                    )}
                  </motion.button>
                </div>

                {/* Amount */}
                <div
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ background: 'linear-gradient(135deg, rgba(255,107,107,0.1), rgba(255,217,61,0.1))' }}
                >
                  <div className="size-8 rounded-full bg-coral/10 flex items-center justify-center">
                    <AlertCircle className="size-4 text-coral" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Send exactly ${price.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">in {currentMethod.currency} on {currentMethod.network}</p>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-4 text-gold-dark shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Only send on the <strong className="text-foreground">{currentMethod.network}</strong>. Sending on the wrong network may result in permanent loss.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-4 text-gold-dark shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Send the <strong className="text-foreground">exact amount</strong> shown above for automatic verification.
                    </p>
                  </div>
                </div>

                {/* Support Link */}
                <button
                  className="flex items-center gap-1.5 text-xs text-teal font-medium min-h-[44px]"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                      window.Telegram.WebApp.openTelegramLink('https://t.me/GYconnectSupport')
                    }
                  }}
                >
                  <HelpCircle className="size-3.5" />
                  Need help? Join Support Channel
                </button>
              </CardContent>
            </Card>

            {/* Step 3: TXID Input */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="size-6 rounded-full bg-coral text-white text-xs font-bold flex items-center justify-center">3</span>
                <h3 className="font-semibold">Verify Payment</h3>
              </div>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Transaction ID</label>
                    <Input
                      placeholder="Paste your Transaction ID"
                      value={txid}
                      onChange={(e) => { setTxid(e.target.value); setVerifyStatus('idle') }}
                      className="h-12 text-sm"
                    />
                  </div>

                  <Button
                    className="w-full h-12 font-semibold text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #FF6B6B, #EE5A5A)' }}
                    disabled={!txid.trim() || verifyStatus === 'pending'}
                    onClick={handleVerify}
                  >
                    {verifyStatus === 'pending' ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Payment
                        <ArrowRight className="size-4 ml-1" />
                      </>
                    )}
                  </Button>

                  {/* Verification Status */}
                  {verifyStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-teal/10"
                    >
                      <CheckCircle2 className="size-10 text-teal" />
                      <p className="font-semibold text-teal text-center">Payment verified!</p>
                      <p className="text-xs text-muted-foreground text-center">
                        Your {PLAN_NAMES[selectedPlan]?.split(' - ')[0] || 'Gold'} plan is now active.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-2 border-teal/30 text-teal"
                        onClick={() => setPage('profile')}
                      >
                        Back to Profile
                      </Button>
                    </motion.div>
                  )}

                  {verifyStatus === 'failed' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-destructive/10"
                    >
                      <XCircle className="size-10 text-destructive" />
                      <p className="font-semibold text-destructive text-center">Verification failed</p>
                      <p className="text-xs text-muted-foreground text-center">{failReason}</p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVerifyStatus('idle')
                            setTxid('')
                          }}
                        >
                          Try Again
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-teal/30 text-teal"
                          onClick={() => {
                            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                              window.Telegram.WebApp.openTelegramLink('https://t.me/GYconnectSupport')
                            }
                          }}
                        >
                          Contact Support
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Security Note */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
          <Shield className="size-4 text-teal shrink-0" />
          <p className="text-xs text-muted-foreground">
            All transactions are secured and verified on-chain. Your payment details are never stored.
          </p>
        </div>
      </div>
    </div>
  )
}
