import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'

export const metadata = { title: 'Dashboard — SkillForge' }

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [profile] = await query<{ name: string; coin_balance: number; learning_streak: number }>(
    `SELECT u.name, p.coin_balance, p.learning_streak
     FROM users u
     JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?`,
    [session.userId]
  )

  const [badgeRow] = await query<{ count: number }>(
    `SELECT COUNT(*) AS count FROM badges WHERE user_id = ?`,
    [session.userId]
  )

  const roadmaps = await query<{ id: string; title: string; skill_domain: string; status: string; total_cps: number; done_cps: number }>(
    `SELECT
       r.id, r.title, r.skill_domain, r.status,
       COUNT(c.id) AS total_cps,
       SUM(CASE WHEN c.status = 'COMPLETED' THEN 1 ELSE 0 END) AS done_cps
     FROM roadmaps r
     LEFT JOIN checkpoints c ON c.roadmap_id = r.id
     WHERE r.user_id = ? AND r.status != 'REMOVED'
     GROUP BY r.id, r.title, r.skill_domain, r.status, r.created_at
     ORDER BY r.created_at DESC
     LIMIT 6`,
    [session.userId]
  )

  const todayTasks = await query<{ id: string; title: string; coin_reward: number; checkpoint_title: string; roadmap_title: string; roadmap_id: string }>(
    `SELECT dt.id, dt.title, dt.coin_reward,
            c.title AS checkpoint_title,
            r.title AS roadmap_title, r.id AS roadmap_id
     FROM daily_tasks dt
     JOIN checkpoints c ON c.id = dt.checkpoint_id
     JOIN roadmaps r ON r.id = c.roadmap_id
     WHERE dt.user_id = ?
       AND dt.status = 'PENDING'
       AND DATE(dt.scheduled_date) = CURDATE()
       AND c.status = 'IN_PROGRESS'
     ORDER BY r.created_at, c.order_index, dt.created_at
     LIMIT 8`,
    [session.userId]
  )

  const leaderboard = await query<{ rank: number; coins_earned: number; badges_count: number; name: string; user_id: string }>(
    `SELECT l.rank, l.coins_earned, l.badges_count, u.name, u.id AS user_id
     FROM leaderboard l
     JOIN users u ON u.id = l.user_id
     ORDER BY (l.rank IS NULL), l.rank
     LIMIT 5`
  )

  const coins = profile?.coin_balance ?? 0
  const streak = profile?.learning_streak ?? 0
  const badges = Number(badgeRow?.count ?? 0)
  const level = Math.max(1, Math.floor(coins / 100))
  const firstName = profile?.name?.split(' ')[0] ?? 'Learner'

  const roadmapList = roadmaps.map((r) => ({ ...r, total_cps: Number(r.total_cps), done_cps: Number(r.done_cps) }))

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 via-blue-500 to-indigo-600 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white" />
          <div className="absolute -bottom-12 -left-8 w-64 h-64 rounded-full bg-white" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Welcome back, {firstName}!
              <svg className="w-5 h-5 text-yellow-300 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z" clipRule="evenodd" />
              </svg>
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              {streak > 0 ? `You're on a ${streak} day learning streak!` : 'Start your learning streak today!'}
            </p>
          </div>
          <div className="flex items-center gap-6 sm:gap-8 shrink-0">
            <StatBadge value={coins.toLocaleString()} label="Coins" />
            <div className="w-px h-8 bg-white/20" />
            <StatBadge value={badges.toString()} label="Badges" />
            <div className="w-px h-8 bg-white/20" />
            <StatBadge value={`Lv.${level}`} label="Level" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Roadmaps + Tasks */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active Roadmaps */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Active Roadmaps</h2>
              <Link
                href="/roadmap/search"
                className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                Find New Skill
              </Link>
            </div>

            {roadmapList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">No roadmaps yet</h3>
                <p className="text-sm text-gray-400 mb-5">Generate your first AI-powered learning roadmap to get started</p>
                <Link
                  href="/roadmap/search"
                  className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
                >
                  Generate Roadmap
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {roadmapList.map((r) => {
                  const pct = r.total_cps > 0 ? Math.round((r.done_cps / r.total_cps) * 100) : 0
                  return (
                    <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-0.5">{r.skill_domain}</p>
                          <h3 className="text-base font-bold text-gray-900 line-clamp-1">{r.title}</h3>
                          <p className="text-sm text-teal-600 font-medium mt-0.5">
                            {r.done_cps}/{r.total_cps} checkpoints completed
                          </p>
                        </div>
                        <span className="ml-3 shrink-0 text-sm font-bold text-white bg-blue-600 px-2.5 py-1 rounded-lg">
                          {pct}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                        <div
                          className="bg-linear-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {r.total_cps > 0 && (
                        <div className="flex gap-1 mb-4">
                          {Array.from({ length: r.total_cps }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full ${i < r.done_cps ? 'bg-blue-500' : 'bg-gray-200'}`}
                            />
                          ))}
                        </div>
                      )}

                      <Link
                        href={`/roadmap/${r.id}`}
                        className="flex items-center justify-center gap-2 w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
                      >
                        View Details
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Today's Tasks */}
          {todayTasks.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-4">Today&apos;s Tasks</h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {todayTasks.map((task, i) => (
                  <div key={task.id} className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                    <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{task.roadmap_title} · {task.checkpoint_title}</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 shrink-0">+{task.coin_reward} SCS</span>
                    <Link
                      href={`/roadmap/${task.roadmap_id}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 shrink-0 transition-colors"
                    >
                      Go →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: Quick Actions + Leaderboard */}
        <div className="space-y-5">

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-1">
              <QuickAction
                href="/community/feed"
                label="Ask Community"
                iconColor="text-blue-500"
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V20.5l4.5-4.5h.765" />}
              />
              <QuickAction
                href="/expert"
                label="Book Expert"
                iconColor="text-purple-500"
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />}
              />
              <QuickAction
                href="/gamification/badges"
                label="View Badges"
                iconColor="text-amber-500"
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />}
              />
            </div>
          </div>

          {/* Top Learners */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Top Learners</h2>
              <Link href="/community/leaderboard" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                View all
              </Link>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No leaderboard data yet</p>
            ) : (
              <div className="space-y-1">
                {leaderboard.map((row) => {
                  const isMe = row.user_id === session.userId
                  const rankColors: Record<number, string> = {
                    1: 'bg-amber-400 text-white',
                    2: 'bg-gray-300 text-gray-700',
                    3: 'bg-orange-400 text-white',
                  }
                  const rankBg = rankColors[row.rank] ?? 'bg-blue-100 text-blue-700'
                  return (
                    <div
                      key={row.user_id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isMe ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${rankBg}`}>
                        {row.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isMe ? 'text-indigo-700' : 'text-gray-900'}`}>
                          {row.name}{isMe ? ' (you)' : ''}
                        </p>
                        <p className="text-xs text-gray-400">{Number(row.coins_earned).toLocaleString()} pts</p>
                      </div>
                      <MedalIcon rank={row.rank} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold leading-tight">{value}</p>
      <p className="text-blue-200 text-xs mt-0.5">{label}</p>
    </div>
  )
}

function QuickAction({ href, label, icon, iconColor }: { href: string; label: string; icon: ReactNode; iconColor: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
      <div className="w-9 h-9 rounded-xl bg-gray-50 group-hover:bg-white flex items-center justify-center shrink-0 border border-gray-100 transition-colors">
        <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
      <svg className="w-4 h-4 text-gray-300 ml-auto group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  )
}

function MedalIcon({ rank }: { rank: number }) {
  const colors: Record<number, string> = { 1: 'text-amber-400', 2: 'text-gray-400', 3: 'text-orange-400' }
  const color = colors[rank] ?? 'text-blue-400'
  return (
    <svg className={`w-5 h-5 shrink-0 ${color}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}
