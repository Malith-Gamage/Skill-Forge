'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function RefreshButton({
  variant = 'light',
  label = 'Refresh',
}: {
  variant?: 'light' | 'dark'
  label?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleRefresh() {
    startTransition(() => router.refresh())
  }

  const base = 'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-60 shrink-0'
  const darkClass = `${base} bg-white/15 border-white/30 text-white hover:bg-white/25`
  const lightClass = `${base} bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100`

  return (
    <button
      onClick={handleRefresh}
      disabled={pending}
      className={variant === 'dark' ? darkClass : lightClass}
    >
      <svg
        className={`w-3.5 h-3.5 ${pending ? 'animate-spin' : ''}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
      {pending ? 'Refreshing…' : label}
    </button>
  )
}
