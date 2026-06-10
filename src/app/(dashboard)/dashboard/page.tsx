import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'
import RemoveRoadmapButton from '@/components/dashboard/RemoveRoadmapButton'
import AnimatedBar from '@/components/dashboard/AnimatedBar'
import CountUp from '@/components/dashboard/CountUp'

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
    `SELECT
       u.id                                                          AS user_id,
       u.name,
       p.total_coins_earned                                         AS coins_earned,
       RANK() OVER (ORDER BY p.total_coins_earned DESC, u.name ASC) AS \`rank\`,
       COALESCE(bdg.badges_count, 0)                               AS badges_count
     FROM users u
     JOIN profiles p ON p.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS badges_count
       FROM badges GROUP BY user_id
     ) bdg ON bdg.user_id = u.id
     ORDER BY p.total_coins_earned DESC, u.name ASC
     LIMIT 5`
  )

  const coins = profile?.coin_balance ?? 0
  const streak = profile?.learning_streak ?? 0
  const badges = Number(badgeRow?.count ?? 0)
  const level = Math.max(1, Math.floor(coins / 100))
  const firstName = profile?.name?.split(' ')[0] ?? 'Learner'

  const roadmapList = roadmaps.map((r) => ({ ...r, total_cps: Number(r.total_cps), done_cps: Number(r.done_cps) }))

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Welcome Banner ── */}
      <div className="dash-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-800 via-blue-700 to-indigo-800 p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 w-72 h-72 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="pointer-events-none absolute top-6 right-52 w-2.5 h-2.5 rounded-full bg-white/25 sparkle-dot" />
        <div className="pointer-events-none absolute bottom-8 right-28 w-1.5 h-1.5 rounded-full bg-white/20 sparkle-dot-2" />
        <div className="pointer-events-none absolute top-1/2 right-1/3 w-2 h-2 rounded-full bg-white/15 sparkle-dot-3" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest text-blue-300 uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Learning Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Welcome back, {firstName}!{' '}
              <svg className="inline w-6 h-6 text-yellow-300 mb-1" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
              </svg>
            </h1>
            <p className="mt-2 text-blue-200/80 text-sm leading-relaxed">
              {streak > 0
                ? `🔥 You're on a ${streak}-day streak — keep the momentum!`
                : 'Start your first learning streak today!'}
            </p>
          </div>

          <div className="flex items-stretch gap-3 shrink-0">
            <StatPill value={coins} label="Coins" delay="0.25s" />
            <StatPill value={badges} label="Badges" delay="0.38s" />
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-7">

          {/* Active Roadmaps */}
          <section>
            <div className="dash-fade-up dash-d-2 flex items-end justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Active Roadmaps</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {roadmapList.length > 0
                    ? `${roadmapList.length} roadmap${roadmapList.length > 1 ? 's' : ''} tracked`
                    : 'No roadmaps yet'}
                </p>
              </div>
              <Link
                href="/roadmap/search"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors shadow-sm shadow-indigo-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Skill
              </Link>
            </div>

            {roadmapList.length === 0 ? (
              <div className="dash-fade-up dash-d-3 bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">No roadmaps yet</h3>
                <p className="text-sm text-gray-400 mb-6">Generate your first AI-powered learning roadmap to get started</p>
                <Link
                  href="/roadmap/search"
                  className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
                >
                  Generate Roadmap
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {roadmapList.map((r, index) => {
                  const pct = r.total_cps > 0 ? Math.round((r.done_cps / r.total_cps) * 100) : 0
                  const isComplete = pct === 100
                  const cardDelay = `${0.18 + index * 0.1}s`
                  return (
                    <div
                      key={r.id}
                      className={`roadmap-card dash-fade-up relative bg-white rounded-2xl border shadow-sm overflow-hidden ${
                        isComplete ? 'border-emerald-100' : 'border-gray-100'
                      }`}
                      style={{ animationDelay: cardDelay }}
                    >
                      {/* animated top accent line */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-100">
                        <AnimatedBar
                          pct={pct}
                          className={`h-full ${isComplete ? 'bg-linear-to-r from-emerald-400 to-teal-500' : 'bg-linear-to-r from-blue-500 to-indigo-500'}`}
                        />
                      </div>

                      <div className="flex items-center gap-4 p-5 pt-6">
                        {/* percentage badge */}
                        <div className={`shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${
                          isComplete ? 'bg-emerald-50' : 'bg-blue-50'
                        }`}>
                          <span className={`text-base font-extrabold leading-none ${isComplete ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {pct}%
                          </span>
                          <span className={`text-[10px] font-medium mt-0.5 ${isComplete ? 'text-emerald-400' : 'text-blue-400'}`}>
                            done
                          </span>
                        </div>

                        {/* content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isComplete ? 'text-emerald-500' : 'text-blue-500'}`}>
                              {r.skill_domain}
                            </span>
                            {isComplete && (
                              <span className="text-[10px] font-bold text-white bg-emerald-500 px-1.5 py-0.5 rounded-md leading-none">
                                Completed
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-2">{r.title}</h3>

                          {/* animated progress bar */}
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <AnimatedBar
                              pct={pct}
                              className={`h-1.5 rounded-full ${isComplete ? 'bg-linear-to-r from-emerald-400 to-teal-500' : 'bg-linear-to-r from-blue-500 to-indigo-500'}`}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5">{r.done_cps} of {r.total_cps} checkpoints</p>
                          {isComplete && <RemoveRoadmapButton roadmapId={r.id} />}
                        </div>

                        {/* action button */}
                        <Link
                          href={`/roadmap/${r.id}`}
                          className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all ${
                            isComplete
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-100'
                          }`}
                        >
                          {isComplete ? 'Review' : 'Continue'}
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Today's Tasks */}
          {todayTasks.length > 0 && (
            <section>
              <div className="dash-fade-up dash-d-4 mb-5">
                <h2 className="text-lg font-bold text-gray-900">Today&apos;s Tasks</h2>
                <p className="text-xs text-gray-400 mt-0.5">{todayTasks.length} pending task{todayTasks.length > 1 ? 's' : ''}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {todayTasks.map((task, i) => (
                  <div
                    key={task.id}
                    className="dash-fade-up flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors group"
                    style={{ animationDelay: `${0.35 + i * 0.06}s` }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{task.roadmap_title} · {task.checkpoint_title}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                      +{task.coin_reward} SCS
                    </span>
                    <Link
                      href={`/roadmap/${task.roadmap_id}`}
                      className="shrink-0 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      Go →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <div className="space-y-5">

          {/* Quick Actions */}
          <div className="dash-slide-right dash-d-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</p>
            <div className="space-y-1">
              <QuickAction
                href="/community/feed"
                label="Ask Community"
                iconBg="bg-blue-50"
                iconColor="text-blue-500"
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V20.5l4.5-4.5h.765" />}
              />
              <QuickAction
                href="/expert"
                label="Book Expert"
                iconBg="bg-purple-50"
                iconColor="text-purple-500"
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />}
              />
              <QuickAction
                href="/gamification/badges"
                label="View Badges"
                iconBg="bg-amber-50"
                iconColor="text-amber-500"
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />}
              />
            </div>
          </div>

          {/* Top Learners */}
          <div className="dash-slide-right dash-d-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Top Learners</p>
              <Link href="/community/leaderboard" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                View all →
              </Link>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No leaderboard data yet</p>
            ) : (
              <div className="space-y-1">
                {leaderboard.map((row, i) => {
                  const isMe = row.user_id === session.userId
                  return (
                    <div
                      key={row.user_id}
                      className={`dash-fade-up flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                        isMe ? 'bg-indigo-50 ring-1 ring-indigo-100' : 'hover:bg-gray-50'
                      }`}
                      style={{ animationDelay: `${0.4 + i * 0.07}s` }}
                    >
                      <StageImage rank={row.rank} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isMe ? 'text-indigo-700' : 'text-gray-900'}`}>
                          {row.name}{isMe ? ' (you)' : ''}
                        </p>
                        <p className="text-xs text-gray-400">{Number(row.coins_earned).toLocaleString()} pts</p>
                      </div>
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

function StatPill({ value, label, delay }: { value: number; label: string; delay?: string }) {
  return (
    <div
      className="dash-scale-up text-center bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3.5 border border-white/15 min-w-20"
      style={delay ? { animationDelay: delay } : undefined}
    >
      <p className="text-2xl font-extrabold leading-none text-white">
        <CountUp to={value} />
      </p>
      <p className="text-blue-200/80 text-xs font-medium mt-1">{label}</p>
    </div>
  )
}

function QuickAction({ href, label, icon, iconColor, iconBg }: { href: string; label: string; icon: ReactNode; iconColor: string; iconBg: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0 transition-colors`}>
        <svg className={`w-4.5 h-4.5 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
      <svg className="w-4 h-4 text-gray-300 ml-auto group-hover:text-gray-400 transition-all group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  )
}

function StageImage({ rank }: { rank: number }) {
  const stageMap: Record<number, string> = {
    1: '/stage 1.png',
    2: '/stage 2.png',
    3: '/stage 3.png',
    4: '/stage 4.png',
    5: '/stage 5.png',
  }
  const src = stageMap[rank]
  if (!src) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={72} height={72} className="shrink-0 object-contain" />
  )
}
