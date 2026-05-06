import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

const PLAN_PRICES: Record<string, number> = {
  silver: 2,
  gold: 4,
  diamond: 6,
}

const CELO_USDT_WALLET = '0x712c79c774f335c81bd4a46efff948bca9867ab8'
const SOLANA_WALLET = '4bciiEgbD3bMakErgjc1EpVKPKE17y8onEVo6GM9XzpC'
const CELO_USDT_CONTRACT = '0x765de816845861e75a25fca122bb6898b8b1282a'

const ALCHEMY_CELO_URL = process.env.ALCHEMY_CELO_URL || 'https://celo-mainnet.g.alchemy.com/v2/EeveSdz3xJHjicPPYZB8J'
const ALCHEMY_SOLANA_URL = process.env.ALCHEMY_SOLANA_URL || 'https://solana-mainnet.g.alchemy.com/v2/KKs_FrcPJIj75uLWBWVz4'

function hexToNumber(hex: string): number {
  return parseInt(hex, 16)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { txid, network, plan, profile_id, amount } = body

    if (!txid || !network || !plan || !profile_id) {
      return NextResponse.json(
        { error: 'txid, network, plan, and profile_id are required' },
        { status: 400 }
      )
    }

    if (!['celo', 'solana'].includes(network)) {
      return NextResponse.json({ error: 'network must be celo or solana' }, { status: 400 })
    }

    if (!PLAN_PRICES[plan]) {
      return NextResponse.json({ error: 'Invalid plan. Must be silver, gold, or diamond' }, { status: 400 })
    }

    // Check if TXID already used
    const existingPayment = await turso.execute({
      sql: 'SELECT id FROM payments WHERE txid = ?',
      args: [txid],
    })

    if (existingPayment.rows.length > 0) {
      return NextResponse.json({ error: 'Transaction ID already used' }, { status: 409 })
    }

    const planPrice = PLAN_PRICES[plan]
    let verified = false
    let txAmount = 0
    let txDetails: any = null

    try {
      if (network === 'celo') {
        // Verify on Celo via Alchemy
        const response = await fetch(ALCHEMY_CELO_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getTransactionByHash',
            params: [txid],
          }),
        })

        const data = await response.json()
        const tx = data.result

        if (!tx) {
          return NextResponse.json({
            verified: false,
            error: 'Transaction not found on Celo network',
          }, { status: 404 })
        }

        // Check recipient wallet (case-insensitive)
        const toAddress = String(tx.to || '').toLowerCase()
        if (toAddress !== CELO_USDT_WALLET.toLowerCase()) {
          return NextResponse.json({
            verified: false,
            error: 'Transaction recipient does not match expected wallet',
          }, { status: 400 })
        }

        // For USDT transfers, check the input data for the transfer amount
        // USDT transfer on Celo: the value field might be 0, amount is in the input data
        if (tx.value && tx.value !== '0x0') {
          txAmount = hexToNumber(tx.value) / 1e18
        }

        // Try to decode USDT transfer from input data
        if (tx.input && tx.input.length > 10) {
          const methodId = tx.input.slice(0, 10)
          // ERC20 transfer method signature: 0xa9059cbb
          if (methodId === '0xa9059cbb' && tx.input.length >= 74) {
            const amountHex = '0x' + tx.input.slice(74)
            txAmount = hexToNumber(amountHex) / 1e6 // USDT has 6 decimals
          }
        }

        // Check transaction is within 24 hours
        // Celo doesn't return timestamp in eth_getTransactionByHash directly
        // We'll use the block number approach if needed
        txDetails = {
          from: tx.from,
          to: tx.to,
          value: tx.value,
          blockHash: tx.blockHash,
        }

        verified = txAmount >= planPrice

      } else if (network === 'solana') {
        // Verify on Solana via Alchemy
        const response = await fetch(ALCHEMY_SOLANA_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getTransaction',
            params: [
              txid,
              { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
            ],
          }),
        })

        const data = await response.json()
        const tx = data.result

        if (!tx) {
          return NextResponse.json({
            verified: false,
            error: 'Transaction not found on Solana network',
          }, { status: 404 })
        }

        // Check block time is within 24 hours
        const blockTime = tx.blockTime
        if (blockTime) {
          const txTime = new Date(blockTime * 1000)
          const now = new Date()
          const hoursDiff = (now.getTime() - txTime.getTime()) / (1000 * 60 * 60)
          if (hoursDiff > 24) {
            return NextResponse.json({
              verified: false,
              error: 'Transaction is older than 24 hours',
            }, { status: 400 })
          }
        }

        // Parse Solana transaction for SPL token transfer (USDT)
        const instructions = tx.transaction?.message?.instructions || []
        const accountKeys = tx.transaction?.message?.accountKeys || []

        // Check if any account key matches our wallet
        const walletFound = accountKeys.some(
          (key: any) =>
            (typeof key === 'string' && key.toLowerCase() === SOLANA_WALLET) ||
            (key.pubkey && key.pubkey.toLowerCase() === SOLANA_WALLET)
        )

        if (!walletFound) {
          return NextResponse.json({
            verified: false,
            error: 'Transaction does not involve expected wallet',
          }, { status: 400 })
        }

        // Try to extract amount from parsed instruction
        for (const instr of instructions) {
          if (instr.parsed?.info?.lamports) {
            txAmount = instr.parsed.info.lamports / 1e9
          } else if (instr.parsed?.info?.tokenAmount?.uiAmount) {
            txAmount = instr.parsed.info.tokenAmount.uiAmount
          } else if (instr.parsed?.info?.amount) {
            txAmount = instr.parsed.info.amount / 1e6 // USDT has 6 decimals on Solana too
          }
        }

        txDetails = {
          slot: tx.slot,
          blockTime: tx.blockTime,
          fee: tx.meta?.fee,
        }

        verified = txAmount >= planPrice && walletFound
      }
    } catch (verifyError: any) {
      console.error('Verification error:', verifyError)
      // Still save the payment as pending for manual review
    }

    const now = new Date().toISOString()
    const paymentId = crypto.randomUUID()

    // Save payment record
    await turso.execute({
      sql: `INSERT INTO payments (id, profile_id, txid, network, amount, plan, status, verified_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        paymentId,
        profile_id,
        txid,
        network,
        txAmount || Number(amount) || 0,
        plan,
        verified ? 'verified' : 'pending',
        verified ? now : null,
        now,
      ],
    })

    // If verified, update profile subscription
    if (verified) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days subscription

      await turso.execute({
        sql: `UPDATE profiles SET subscription_tier = ?, subscription_expires_at = ?, updated_at = ?
              WHERE id = ?`,
        args: [plan, expiresAt.toISOString(), now, profile_id],
      })
    }

    return NextResponse.json({
      verified,
      amount: txAmount,
      plan,
      plan_price: planPrice,
      status: verified ? 'verified' : 'pending',
      message: verified
        ? `Payment verified! ${plan} plan activated for 30 days.`
        : 'Payment is pending manual verification. You will be notified once confirmed.',
    })
  } catch (error: any) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 })
  }
}
