'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RemoveRoadmapButton({ roadmapId }: { roadmapId: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    setLoading(true)
    await fetch(`/api/roadmap/${roadmapId}`, { method: 'DELETE' })
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-gray-500 flex-1">Remove this roadmap from your dashboard?</span>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleRemove}
          disabled={loading}
          className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
        >
          {loading ? 'Removing…' : 'Remove'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 mt-3 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
      </svg>
      Remove roadmap
    </button>
  )
}
