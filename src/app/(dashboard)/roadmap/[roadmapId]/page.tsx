import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import TaskItem from '@/components/roadmap/TaskItem'

interface Checkpoint {
  id: string
  title: string
  order_index: number
  status: 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED'
  total_tasks: number
  completed_tasks: number
}

interface Task {
  id: string
  title: string
  status: string
  coin_reward: number
}

interface Resource {
  id: string
  title: string
  type: string
  url: string
}

interface Roadmap {
  id: string
  title: string
  skill_domain: string
  status: string
}

export const metadata = { title: 'Roadmap — SkillForge' }

export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ roadmapId: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { roadmapId } = await params

  const checkpoints = (await query<Checkpoint>(
    `SELECT
       c.id, c.title, c.order_index, c.status,
       COUNT(dt.id) AS total_tasks,
       SUM(CASE WHEN dt.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_tasks
     FROM roadmaps r
     JOIN checkpoints c ON c.roadmap_id = r.id
     LEFT JOIN daily_tasks dt ON dt.checkpoint_id = c.id AND dt.user_id = ?
     WHERE r.id = ? AND r.user_id = ? AND r.status != 'REMOVED'
     GROUP BY c.id, c.title, c.order_index, c.status
     ORDER BY c.order_index`,
    [session.userId, roadmapId, session.userId]
  )).map((c) => ({ ...c, total_tasks: Number(c.total_tasks), completed_tasks: Number(c.completed_tasks) }))

  if (checkpoints.length === 0) notFound()

  const [roadmap] = await query<Roadmap>(
    `SELECT id, title, skill_domain, status FROM roadmaps WHERE id = ? AND user_id = ?`,
    [roadmapId, session.userId]
  )

  const activeCheckpoint = checkpoints.find((c) => c.status === 'IN_PROGRESS')
  const completedCount = checkpoints.filter((c) => c.status === 'COMPLETED').length
  const progressPct = checkpoints.length > 0 ? Math.round((completedCount / checkpoints.length) * 100) : 0

  let tasks: Task[] = []
  let resources: Resource[] = []

  if (activeCheckpoint) {
    tasks = await query<Task>(
      `SELECT id, title, status, coin_reward FROM daily_tasks WHERE checkpoint_id = ? AND user_id = ? ORDER BY created_at`,
      [activeCheckpoint.id, session.userId]
    )

    resources = await query<Resource>(
      `SELECT id, title, type, url FROM resources WHERE checkpoint_id = ?`,
      [activeCheckpoint.id]
    )
  }

  const cpIcon = {
    COMPLETED: (
      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
    ),
    IN_PROGRESS: (
      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
        <div className="w-2 h-2 rounded-full bg-white" />
      </div>
    ),
    LOCKED: (
      <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center shrink-0">
        <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
    ),
  }

  const resourceColors: Record<string, string> = {
    VIDEO: 'bg-red-100 text-red-600',
    ARTICLE: 'bg-blue-100 text-blue-600',
    COURSE: 'bg-purple-100 text-purple-600',
    PODCAST: 'bg-green-100 text-green-600',
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Dashboard
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-0.5">{roadmap.skill_domain}</p>
            <h1 className="text-xl font-bold text-gray-900">{roadmap.title}</h1>
          </div>
          {roadmap.status === 'COMPLETED' && (
            <span className="shrink-0 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              Completed!
            </span>
          )}
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{completedCount} of {checkpoints.length} checkpoints done</span>
            <span className="font-medium">{progressPct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Checkpoint sidebar */}
        <div className="w-52 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden sticky top-0">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Checkpoints</p>
            </div>
            <div className="divide-y divide-gray-50">
              {checkpoints.map((cp) => (
                <div
                  key={cp.id}
                  className={`flex items-start gap-2.5 px-3 py-3 ${
                    cp.status === 'IN_PROGRESS' ? 'bg-indigo-50' : ''
                  }`}
                >
                  {cpIcon[cp.status]}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium leading-snug ${
                      cp.status === 'LOCKED'
                        ? 'text-gray-400'
                        : cp.status === 'IN_PROGRESS'
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
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {activeCheckpoint ? (
            <>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">{activeCheckpoint.title}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {activeCheckpoint.completed_tasks}/{activeCheckpoint.total_tasks} tasks completed — click any task to mark it done
                  </p>
                </div>
                <div className="px-3 py-2 divide-y divide-gray-50">
                  {tasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              </div>

              {resources.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">Learning Resources</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {resources.map((res) => (
                      <a
                        key={res.id}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group"
                      >
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${resourceColors[res.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {res.type}
                        </span>
                        <span className="text-sm text-gray-700 group-hover:text-indigo-700 flex-1 truncate">
                          {res.title}
                        </span>
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : roadmap.status === 'COMPLETED' ? (
            <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
                  <svg className="w-9 h-9 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Roadmap Complete!</h2>
              <p className="text-sm text-gray-600 mb-4">
                You&apos;ve finished all checkpoints. Check your badges for your golden badge.
              </p>
              <Link
                href="/gamification/badges"
                className="inline-flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                View badges
              </Link>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-500">No active checkpoint. Complete earlier checkpoints to unlock new ones.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
