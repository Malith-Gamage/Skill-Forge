'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Task {
  id: string
  title: string
  status: string
  coin_reward: number
}

interface TaskItemProps {
  task: Task
  index?: number
}

export default function TaskItem({ task, index = 0 }: TaskItemProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const [status,  setStatus]  = useState(task.status)
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
          router.push(pathname)
        } else {
          router.refresh()
        }
      } else {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const done = status === 'COMPLETED'

  return (
    <div
      style={{ animationDelay: `${index * 0.06}s` }}
      className={`roadmap-fade-up task-row flex items-center gap-3 px-3 py-3 ${
        done ? 'task-done opacity-60' : 'cursor-pointer'
      }`}
      onClick={!done ? complete : undefined}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); complete() }}
        disabled={done || loading}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
          done
            ? 'bg-green-500 border-green-500 shadow-sm'
            : loading
            ? 'border-indigo-300 bg-indigo-50'
            : 'border-gray-300 group-hover:border-indigo-400'
        }`}
        aria-label={done ? 'Completed' : 'Mark complete'}
      >
        {done && (
          <svg className="w-2.5 h-2.5 text-white task-check-anim" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
        {loading && !done && (
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
        )}
      </button>

      {/* Title */}
      <p className={`flex-1 text-sm font-medium min-w-0 transition-colors duration-200 ${
        done ? 'text-gray-400 line-through' : 'text-gray-800'
      }`}>
        {task.title}
      </p>

      {/* Coin reward */}
      <div className={`flex items-center gap-1 shrink-0 transition-all duration-200 ${
        done ? 'opacity-30' : ''
      }`}>
        <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9.555 7.168A1 1 0 0 0 8 8v4a1 1 0 0 0 1.555.832l3-2a1 1 0 0 0 0-1.664l-3-2Z" clipRule="evenodd" />
        </svg>
        <span className={`text-xs font-bold ${done ? 'text-gray-300' : 'text-amber-500'}`}>
          +{task.coin_reward}
        </span>
      </div>
    </div>
  )
}
