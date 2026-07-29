'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RefreshLeaderboardButton({
  variant = 'light',
  label,
}: {
  variant?: 'light' | 'dark'
  label?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRefresh() {
    setLoading(true)
    try {
      await fetch('/api/leaderboard/refresh', { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const iconOnly = 'flex items-center justify-center w-6 h-6 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors shrink-0'
  const withLabel = 'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-60 shrink-0'
  const darkWithLabel = `${withLabel} bg-white/10 border-white/20 text-white hover:bg-white/20`
  const lightWithLabel = `${withLabel} bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100`

  const className = label
    ? (variant === 'dark' ? darkWithLabel : lightWithLabel)
    : iconOnly

  return (
    <button onClick={handleRefresh} disabled={loading} title="Refresh leaderboard" className={className}>
      <svg
        className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
      {label && (loading ? 'Refreshing…' : label)}
    </button>
  )
}
