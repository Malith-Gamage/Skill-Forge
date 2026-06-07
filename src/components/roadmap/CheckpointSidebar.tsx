'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Checkpoint {
  id: string
  title: string
  status: 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED'
  order_index: number
  total_tasks: number
  completed_tasks: number
}

export default function CheckpointSidebar({ checkpoints }: { checkpoints: Checkpoint[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeCp = searchParams.get('cp')

  function select(id: string) {
    router.push(`${pathname}?cp=${id}`)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden sticky top-4">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Checkpoints</p>
      </div>
      <div className="divide-y divide-gray-50">
        {checkpoints.map((cp) => {
          const isActive = activeCp ? cp.id === activeCp : cp.status === 'IN_PROGRESS'
          return (
            <button
              key={cp.id}
              disabled={cp.status === 'LOCKED'}
              onClick={() => select(cp.id)}
              className={`w-full flex items-start gap-2.5 px-3 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-indigo-50'
                  : cp.status === 'LOCKED'
                  ? 'cursor-not-allowed opacity-60'
                  : 'hover:bg-gray-50 cursor-pointer'
              }`}
            >
              {cp.status === 'COMPLETED' ? (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              ) : cp.status === 'IN_PROGRESS' ? (
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium leading-snug ${
                  cp.status === 'LOCKED'
                    ? 'text-gray-400'
                    : isActive
                    ? 'text-indigo-800'
                    : 'text-gray-700'
                }`}>
                  {cp.title}
                </p>
                {cp.status !== 'LOCKED' && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {cp.completed_tasks}/{cp.total_tasks} tasks
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
