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

  const doneCount = checkpoints.filter((c) => c.status === 'COMPLETED').length

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm sticky top-4 overflow-hidden roadmap-slide-left rm-d-1">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700 bg-linear-to-br from-gray-50 dark:from-gray-800 to-white dark:to-gray-900">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Checkpoints</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{doneCount} / {checkpoints.length} done</p>
          <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400">
            {checkpoints.length > 0 ? Math.round((doneCount / checkpoints.length) * 100) : 0}%
          </span>
        </div>
        <div className="mt-1.5 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 rounded-full transition-all duration-700"
            style={{ width: `${checkpoints.length > 0 ? Math.round((doneCount / checkpoints.length) * 100) : 0}%` }}
          />
        </div>
      </div>

      <div className="p-3">
        {checkpoints.map((cp, idx) => {
          const isActive = activeCp ? cp.id === activeCp : cp.status === 'IN_PROGRESS'
          const isLast = idx === checkpoints.length - 1
          const isLocked = cp.status === 'LOCKED'
          const pct = cp.total_tasks > 0 ? Math.round((cp.completed_tasks / cp.total_tasks) * 100) : 0

          return (
            <div
              key={cp.id}
              className={`flex items-stretch gap-0 ${!isLocked ? 'cursor-pointer' : 'cursor-not-allowed'} roadmap-fade-up rm-d-${Math.min(idx + 1, 8)}`}
              onClick={!isLocked ? () => select(cp.id) : undefined}
            >
              <div className="flex flex-col items-center w-8 shrink-0">
                <div className={`mt-2.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-200 ${
                  cp.status === 'COMPLETED'
                    ? 'bg-green-500 shadow-sm'
                    : cp.status === 'IN_PROGRESS'
                    ? `bg-indigo-600 shadow-md ${isActive ? 'cp-active-pulse' : ''}`
                    : 'border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                }`}>
                  {cp.status === 'COMPLETED' ? (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : cp.status === 'IN_PROGRESS' ? (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  ) : (
                    <svg className="w-3 h-3 text-gray-300 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {!isLast && (
                  <div className={`mt-1 w-0.5 flex-1 ${
                    cp.status === 'COMPLETED' ? 'bg-green-200 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-700'
                  }`} style={{ minHeight: 8 }} />
                )}
              </div>

              <div className={`flex-1 pt-2 pb-3 pl-1.5 pr-2 rounded-xl transition-all duration-200 mb-0 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-100 dark:ring-indigo-800'
                  : !isLocked
                  ? 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  : 'opacity-50'
              }`}>
                <p className={`text-xs font-semibold leading-snug ${
                  isLocked
                    ? 'text-gray-400 dark:text-gray-500'
                    : isActive
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : cp.status === 'COMPLETED'
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-gray-700 dark:text-gray-200'
                }`}>
                  {cp.title}
                </p>

                {!isLocked && (
                  <div className="mt-1.5">
                    <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          cp.status === 'COMPLETED' ? 'bg-green-400' : 'bg-indigo-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                      {cp.completed_tasks}/{cp.total_tasks} tasks
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
