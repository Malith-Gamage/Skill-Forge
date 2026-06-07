'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Task {
  id: string
  title: string
  status: string
  coin_reward: number
}

export default function TaskItem({ task }: { task: Task }) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState(task.status)
  const [loading, setLoading] = useState(false)

  async function complete() {
    if (status === 'COMPLETED' || loading) return
    setLoading(true)

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      if (res.ok) {
        const data = await res.json()
        setStatus('COMPLETED')
        if (data.checkpointCompleted) {
          // Strip ?cp= so the page auto-selects the newly unlocked checkpoint
          router.push(pathname)
        } else {
          router.refresh()
        }
      } else {
        // Sync UI with actual DB state (task may already be COMPLETED in DB)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const done = status === 'COMPLETED'

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
        done ? 'opacity-60' : 'hover:bg-gray-50 cursor-pointer'
      }`}
      onClick={!done ? complete : undefined}
    >
      <button
        onClick={(e) => { e.stopPropagation(); complete() }}
        disabled={done || loading}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          done
            ? 'bg-green-500 border-green-500'
            : loading
            ? 'border-indigo-300 bg-indigo-50 animate-pulse'
            : 'border-gray-300 hover:border-indigo-400'
        }`}
        aria-label={done ? 'Completed' : 'Mark complete'}
      >
        {done && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </button>

      <p className={`flex-1 text-sm font-medium min-w-0 ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
        {task.title}
      </p>

      <span className={`text-xs font-semibold shrink-0 mt-0.5 ${done ? 'text-gray-300' : 'text-amber-600'}`}>
        +{task.coin_reward}
      </span>
    </div>
  )
}
