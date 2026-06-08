'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  sessionId: string
}

export default function BookingActions({ sessionId }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'confirming' | 'processing' | 'done'>('idle')
  const [meetingLink, setMeetingLink] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  async function submit(action: 'confirm' | 'reject') {
    setMode('processing')
    setError('')
    try {
      const res = await fetch(`/api/expert/booking-requests/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, meetingLink: meetingLink.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        setMode('idle')
        return
      }
      setResult(action === 'confirm' ? 'Confirmed — learner has been notified.' : 'Declined — learner has been refunded.')
      setMode('done')
      router.refresh()
    } catch {
      setError('Network error — please try again')
      setMode('idle')
    }
  }

  if (mode === 'done') {
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        {result}
      </div>
    )
  }

  if (mode === 'processing') {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Processing…
      </div>
    )
  }

  if (mode === 'confirming') {
    return (
      <div className="space-y-2">
        <input
          type="url"
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
          placeholder="Meeting link (e.g. Zoom URL) — optional"
          className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => submit('confirm')}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Confirm booking
          </button>
          <button
            onClick={() => { setMode('idle'); setError('') }}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {error && <p className="text-xs text-red-600 mb-1">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('confirming')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Confirm
        </button>
        <button
          onClick={() => submit('reject')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          Decline
        </button>
      </div>
    </div>
  )
}
