import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import TaskItem from '@/components/roadmap/TaskItem'
import CheckpointSidebar from '@/components/roadmap/CheckpointSidebar'

interface Checkpoint {
  id: string
  title: string
  description: string | null
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

const resourceColors: Record<string, string> = {
  VIDEO: 'bg-red-100 text-red-600',
  ARTICLE: 'bg-blue-100 text-blue-600',
  COURSE: 'bg-purple-100 text-purple-600',
  PODCAST: 'bg-green-100 text-green-600',
}

const platformLabels: Record<string, { label: string; color: string }> = {
  'youtube.com': { label: 'YouTube', color: 'text-red-500' },
  'coursera.org': { label: 'Coursera', color: 'text-blue-600' },
  'udemy.com': { label: 'Udemy', color: 'text-purple-600' },
  'edx.org': { label: 'edX', color: 'text-red-700' },
  'freecodecamp.org': { label: 'freeCodeCamp', color: 'text-green-600' },
  'developer.mozilla.org': { label: 'MDN', color: 'text-orange-600' },
  'dev.to': { label: 'Dev.to', color: 'text-gray-800' },
  'linkedin.com': { label: 'LinkedIn', color: 'text-blue-700' },
  'pluralsight.com': { label: 'Pluralsight', color: 'text-pink-600' },
}

function getPlatform(url: string) {
  try {
    const host = new URL(url).hostname.replace('www.', '')
    return platformLabels[host] ?? { label: host, color: 'text-gray-500' }
  } catch {
    return { label: '', color: 'text-gray-500' }
  }
}

export default async function RoadmapDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ roadmapId: string }>
  searchParams: Promise<{ cp?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { roadmapId } = await params
  const { cp } = await searchParams

  const checkpoints = (await query<Checkpoint>(
    `SELECT
       c.id, c.title, c.description, c.order_index, c.status,
       COUNT(dt.id) AS total_tasks,
       SUM(CASE WHEN dt.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_tasks
     FROM roadmaps r
     JOIN checkpoints c ON c.roadmap_id = r.id
     LEFT JOIN daily_tasks dt ON dt.checkpoint_id = c.id AND dt.user_id = ?
     WHERE r.id = ? AND r.user_id = ? AND r.status != 'REMOVED'
     GROUP BY c.id, c.title, c.description, c.order_index, c.status
     ORDER BY c.order_index`,
    [session.userId, roadmapId, session.userId]
  )).map((c) => ({ ...c, total_tasks: Number(c.total_tasks), completed_tasks: Number(c.completed_tasks) }))

  if (checkpoints.length === 0) notFound()

  const [roadmap] = await query<Roadmap>(
    `SELECT id, title, skill_domain, status FROM roadmaps WHERE id = ? AND user_id = ?`,
    [roadmapId, session.userId]
  )

  const completedCount = checkpoints.filter((c) => c.status === 'COMPLETED').length
  const progressPct = checkpoints.length > 0 ? Math.round((completedCount / checkpoints.length) * 100) : 0

  // The "selected" checkpoint: URL param → IN_PROGRESS → first non-locked
  const selectedCheckpoint =
    (cp && checkpoints.find((c) => c.id === cp && c.status !== 'LOCKED')) ||
    checkpoints.find((c) => c.status === 'IN_PROGRESS') ||
    checkpoints.find((c) => c.status !== 'LOCKED')

  let tasks: Task[] = []
  let resources: Resource[] = []

  if (selectedCheckpoint) {
    tasks = await query<Task>(
      `SELECT id, title, status, coin_reward FROM daily_tasks WHERE checkpoint_id = ? AND user_id = ? ORDER BY created_at`,
      [selectedCheckpoint.id, session.userId]
    )
    resources = await query<Resource>(
      `SELECT id, title, type, url FROM resources WHERE checkpoint_id = ?`,
      [selectedCheckpoint.id]
    )
  }

  const isViewingCompleted = selectedCheckpoint?.status === 'COMPLETED'

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
        {/* Clickable checkpoint sidebar */}
        <div className="w-52 shrink-0">
          <CheckpointSidebar checkpoints={checkpoints} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {selectedCheckpoint ? (
            <>
              {/* Checkpoint header */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-base font-bold text-gray-900">{selectedCheckpoint.title}</h2>
                    {isViewingCompleted && (
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedCheckpoint.completed_tasks}/{selectedCheckpoint.total_tasks} tasks completed
                  </p>
                </div>

                {/* Learning Plan */}
                {selectedCheckpoint.description && (
                  <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                      </svg>
                      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Your Learning Plan</p>
                    </div>
                    <p className="text-sm text-indigo-900 leading-relaxed">{selectedCheckpoint.description}</p>
                  </div>
                )}

                {/* Resource links */}
                {resources.length > 0 && (
                  <div className="border-b border-gray-100">
                    <div className="px-5 pt-3.5 pb-1">
                      <div className="flex items-center gap-1.5 mb-2">
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                        </svg>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Study Materials</p>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {resources.map((res) => {
                        const platform = getPlatform(res.url)
                        return (
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
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 group-hover:text-indigo-700 truncate leading-snug">
                                {res.title}
                              </p>
                              {platform.label && (
                                <p className={`text-[11px] font-medium mt-0.5 ${platform.color}`}>
                                  {platform.label}
                                </p>
                              )}
                            </div>
                            <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Tasks checklist */}
                <div>
                  <div className="px-5 pt-3.5 pb-1">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Tasks{!isViewingCompleted && ' — click to complete'}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-2 divide-y divide-gray-50">
                    {tasks.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              </div>

              {roadmap.status === 'COMPLETED' && (
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
              )}
            </>
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
