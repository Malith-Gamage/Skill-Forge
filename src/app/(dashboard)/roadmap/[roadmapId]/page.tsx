import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import TaskItem from '@/components/roadmap/TaskItem'
import CheckpointSidebar from '@/components/roadmap/CheckpointSidebar'
import { reactivateDueTasks } from '@/lib/tasks'

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

const resourceColors: Record<string, { bg: string; text: string }> = {
  VIDEO:   { bg: 'bg-red-100',    text: 'text-red-600'    },
  ARTICLE: { bg: 'bg-blue-100',   text: 'text-blue-600'   },
  COURSE:  { bg: 'bg-purple-100', text: 'text-purple-600' },
  PODCAST: { bg: 'bg-green-100',  text: 'text-green-600'  },
}

const resourceAccent: Record<string, string> = {
  VIDEO:   'group-hover:border-red-200    group-hover:shadow-red-50',
  ARTICLE: 'group-hover:border-blue-200   group-hover:shadow-blue-50',
  COURSE:  'group-hover:border-purple-200 group-hover:shadow-purple-50',
  PODCAST: 'group-hover:border-green-200  group-hover:shadow-green-50',
}

const platformLabels: Record<string, { label: string; color: string }> = {
  'youtube.com':           { label: 'YouTube',      color: 'text-red-500'    },
  'coursera.org':          { label: 'Coursera',     color: 'text-blue-600'   },
  'udemy.com':             { label: 'Udemy',        color: 'text-purple-600' },
  'edx.org':               { label: 'edX',          color: 'text-red-700'    },
  'freecodecamp.org':      { label: 'freeCodeCamp', color: 'text-green-600'  },
  'developer.mozilla.org': { label: 'MDN',          color: 'text-orange-600' },
  'dev.to':                { label: 'Dev.to',       color: 'text-gray-800'   },
  'linkedin.com':          { label: 'LinkedIn',     color: 'text-blue-700'   },
  'pluralsight.com':       { label: 'Pluralsight',  color: 'text-pink-600'   },
}

function getPlatform(url: string) {
  try {
    const host = new URL(url).hostname.replace('www.', '')
    return platformLabels[host] ?? { label: host, color: 'text-gray-400' }
  } catch {
    return { label: '', color: 'text-gray-400' }
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

  await reactivateDueTasks(session.userId)

  const { roadmapId } = await params
  const { cp }        = await searchParams

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
  )).map((c) => ({
    ...c,
    total_tasks:     Number(c.total_tasks),
    completed_tasks: Number(c.completed_tasks),
  }))

  if (checkpoints.length === 0) notFound()

  const [roadmap] = await query<Roadmap>(
    `SELECT id, title, skill_domain, status FROM roadmaps WHERE id = ? AND user_id = ?`,
    [roadmapId, session.userId]
  )

  const completedCount = checkpoints.filter((c) => c.status === 'COMPLETED').length
  const progressPct    = checkpoints.length > 0
    ? Math.round((completedCount / checkpoints.length) * 100)
    : 0

  const selectedCheckpoint =
    (cp && checkpoints.find((c) => c.id === cp && c.status !== 'LOCKED')) ||
    checkpoints.find((c) => c.status === 'IN_PROGRESS') ||
    checkpoints.find((c) => c.status !== 'LOCKED')

  let tasks: Task[]         = []
  let resources: Resource[] = []

  if (selectedCheckpoint) {
    tasks = await query<Task>(
      `SELECT id, title, status, coin_reward
       FROM daily_tasks WHERE checkpoint_id = ? AND user_id = ? ORDER BY created_at`,
      [selectedCheckpoint.id, session.userId]
    )
    resources = await query<Resource>(
      `SELECT id, title, type, url FROM resources WHERE checkpoint_id = ?`,
      [selectedCheckpoint.id]
    )
  }

  const isCompleted      = selectedCheckpoint?.status === 'COMPLETED'
  const roadmapCompleted = roadmap.status === 'COMPLETED'

  const checkpointNumber = selectedCheckpoint
    ? checkpoints.findIndex((c) => c.id === selectedCheckpoint.id) + 1
    : 0

  const taskPct      = selectedCheckpoint && selectedCheckpoint.total_tasks > 0
    ? Math.round((selectedCheckpoint.completed_tasks / selectedCheckpoint.total_tasks) * 100)
    : 0

  const totalCoins  = tasks.reduce((s, t) => s + t.coin_reward, 0)
  const earnedCoins = tasks.filter((t) => t.status === 'COMPLETED').reduce((s, t) => s + t.coin_reward, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Header card ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden roadmap-fade-up">
        {/* Top accent gradient strip */}
        <div className="h-1 bg-linear-to-r from-indigo-500 via-violet-500 to-purple-500" />

        <div className="px-6 pt-4 pb-5">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors mb-4 group"
          >
            <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Dashboard
          </Link>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                    {roadmap.skill_domain}
                  </span>
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">
                {roadmap.title}
              </h1>
            </div>

            {roadmapCompleted && (
              <span className="shrink-0 inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Completed!
              </span>
            )}
          </div>

          {/* Progress bar + stats */}
          <div className="mt-5 flex items-center gap-5">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">
                  {completedCount} of {checkpoints.length} checkpoints
                </span>
                <span className="text-xs font-bold text-indigo-600">{progressPct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="progress-bar-fill h-full" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {/* Mini stat chips */}
            <div className="flex gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
                <span className="text-[11px] font-semibold text-gray-600">{completedCount}/{checkpoints.length}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9.555 7.168A1 1 0 0 0 8 8v4a1 1 0 0 0 1.555.832l3-2a1 1 0 0 0 0-1.664l-3-2Z" clipRule="evenodd" />
                </svg>
                <span className="text-[11px] font-semibold text-amber-700">{progressPct}% done</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ──────────────────────────────────────── */}
      <div className="flex gap-5 items-start">

        {/* Sidebar */}
        <div className="w-56 shrink-0">
          <CheckpointSidebar checkpoints={checkpoints} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {selectedCheckpoint ? (
            <>
              {/* ── Checkpoint card ──────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden roadmap-fade-up rm-d-2">

                {/* Checkpoint header */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                  {/* Number + status row */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Checkpoint {checkpointNumber} of {checkpoints.length}
                    </span>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Done
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        In Progress
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">
                    {selectedCheckpoint.title}
                  </h2>

                  {/* Task progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                      <span className="font-medium">{selectedCheckpoint.completed_tasks} / {selectedCheckpoint.total_tasks} tasks completed</span>
                      <span className="font-bold">{taskPct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isCompleted ? 'bg-green-400' : 'bg-indigo-400'
                        }`}
                        style={{ width: `${taskPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Learning plan ─────────────────────────────── */}
                {selectedCheckpoint.description && (
                  <div className="mx-5 my-4 flex gap-3 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <div className="w-1 rounded-full bg-linear-to-b from-indigo-400 to-violet-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                        </svg>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                          Your Learning Plan
                        </p>
                      </div>
                      <p className="text-sm text-indigo-900 leading-relaxed">
                        {selectedCheckpoint.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Study materials ───────────────────────────── */}
                {resources.length > 0 && (
                  <div className="px-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 mb-3">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                      </svg>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Study Materials
                      </p>
                      <span className="ml-auto text-[10px] font-bold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                        {resources.length}
                      </span>
                    </div>

                    {/* Resource card grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {resources.map((res) => {
                        const platform = getPlatform(res.url)
                        const colors   = resourceColors[res.type] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
                        const accent   = resourceAccent[res.type] ?? 'group-hover:border-gray-200'
                        return (
                          <a
                            key={res.id}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`group flex flex-col bg-gray-50 hover:bg-white border border-gray-100 rounded-xl p-3.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${accent}`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${colors.bg} ${colors.text}`}>
                                {res.type}
                              </span>
                              <svg className="w-3 h-3 text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                            </div>
                            <p className="text-xs font-semibold text-gray-700 group-hover:text-indigo-700 leading-snug flex-1 transition-colors line-clamp-2">
                              {res.title}
                            </p>
                            {platform.label && (
                              <p className={`text-[10px] font-semibold mt-2 ${platform.color}`}>
                                {platform.label}
                              </p>
                            )}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ── Tasks ─────────────────────────────────────── */}
                <div className="pb-2">
                  <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Tasks{!isCompleted && ' — click to complete'}
                      </p>
                    </div>

                    {/* Coin totals */}
                    {tasks.length > 0 && (
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                        <svg className="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9.555 7.168A1 1 0 0 0 8 8v4a1 1 0 0 0 1.555.832l3-2a1 1 0 0 0 0-1.664l-3-2Z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[10px] font-bold text-amber-600">
                          {earnedCoins}/{totalCoins} coins
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="px-3 pb-1">
                    {tasks.map((task, i) => (
                      <TaskItem key={task.id} task={task} index={i} />
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Completion banner ─────────────────────────────── */}
              {roadmapCompleted && (
                <div className="relative overflow-hidden rounded-2xl border border-green-200 roadmap-fade-up rm-d-4">
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-linear-to-br from-green-50 via-emerald-50 to-teal-50" />

                  {/* Sparkle dots */}
                  <div className="absolute top-5  left-8  w-2   h-2   rounded-full bg-green-300   sparkle-dot"   />
                  <div className="absolute top-10 right-10 w-1.5 h-1.5 rounded-full bg-emerald-400 sparkle-dot-2" />
                  <div className="absolute bottom-8 left-16 w-1.5 h-1.5 rounded-full bg-teal-300   sparkle-dot-3" />
                  <div className="absolute bottom-5 right-8  w-2   h-2   rounded-full bg-green-300   sparkle-dot-4" />
                  <div className="absolute top-1/2 left-1/3  w-1   h-1   rounded-full bg-emerald-300 sparkle-dot-5" />

                  <div className="relative p-8 flex items-center gap-6">
                    {/* Trophy icon */}
                    <div className="shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center shadow-sm">
                        <svg className="w-9 h-9 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-gray-900 mb-0.5">Roadmap Complete!</h2>
                      <p className="text-sm text-gray-600">
                        You&apos;ve mastered all {checkpoints.length} checkpoints. Your golden badge is waiting.
                      </p>
                    </div>

                    {/* CTA */}
                    <Link
                      href="/gamification/badges"
                      className="shrink-0 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-green-200 hover:-translate-y-0.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
                      </svg>
                      View badges
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── Empty state ─────────────────────────────────────── */
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center roadmap-fade-up rm-d-2">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-600">No active checkpoint</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                Complete earlier checkpoints to unlock the next stage.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
