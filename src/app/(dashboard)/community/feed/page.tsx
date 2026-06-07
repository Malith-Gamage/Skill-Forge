import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Community — SkillForge' }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const avatarPalette = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-teal-400 to-cyan-500',
  'from-rose-500 to-orange-400',
  'from-purple-500 to-pink-500',
  'from-emerald-400 to-teal-500',
]

function avatarGradient(name: string): string {
  return avatarPalette[name.charCodeAt(0) % avatarPalette.length]
}

const rankMedal: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
const rankBadge: Record<number, string> = {
  1: 'bg-amber-400 text-white border-amber-300',
  2: 'bg-slate-300 text-slate-700 border-slate-200',
  3: 'bg-orange-400 text-white border-orange-300',
}

function HeroPill({ value, label, delay }: { value: number | string; label: string; delay?: string }) {
  return (
    <div
      className="dash-scale-up text-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/15 min-w-18"
      style={delay ? { animationDelay: delay } : undefined}
    >
      <p className="text-2xl font-extrabold leading-none text-white">{value}</p>
      <p className="text-indigo-200/80 text-[10px] font-medium mt-1">{label}</p>
    </div>
  )
}

export default async function CommunityFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; domain?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const [completedRow] = await query<{ completed: number }>(
    `SELECT COUNT(*) AS completed FROM roadmaps WHERE user_id = ? AND status = 'COMPLETED'`,
    [session.userId]
  )
  const completed = Number(completedRow?.completed ?? 0)

  if (completed === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center dash-fade-up px-4">
          <div className="badge-trophy-float inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-indigo-50 mb-6">
            <svg className="w-12 h-12 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Community Locked</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            Complete at least one full learning roadmap to unlock the community and connect with fellow learners.
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-indigo-500 font-semibold bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            0 roadmaps completed
          </div>
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-linear-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
            >
              View my roadmaps
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { page, domain } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1)
  const offset = (pageNum - 1) * 20
  const domainFilter = domain?.trim() ?? ''

  const domainWherePost  = domainFilter ? `AND cp.skill_domain LIKE ?` : ''
  const domainWhereCount = domainFilter ? `AND skill_domain LIKE ?` : ''
  const domainParam      = domainFilter ? [`%${domainFilter}%`] : []

  const posts = await query<{
    id: string; title: string; skill_domain: string; status: string;
    created_at: string; coin_cost: number; author_name: string;
    answer_count: number; accepted_count: number
  }>(
    `SELECT cp.id, cp.title, cp.skill_domain, cp.status, cp.created_at, cp.coin_cost,
            u.name AS author_name,
            COUNT(ca.id) AS answer_count,
            SUM(CASE WHEN ca.is_accepted THEN 1 ELSE 0 END) AS accepted_count
     FROM community_posts cp
     JOIN users u ON u.id = cp.user_id
     LEFT JOIN community_answers ca ON ca.post_id = cp.id
     WHERE cp.status != 'CLOSED'
     ${domainWherePost}
     GROUP BY cp.id, cp.title, cp.skill_domain, cp.status, cp.created_at, cp.coin_cost, u.name
     ORDER BY cp.created_at DESC
     LIMIT 20 OFFSET ${offset}`,
    domainParam
  )

  const [totalRow] = await query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM community_posts WHERE status != 'CLOSED' ${domainWhereCount}`,
    domainParam
  )
  const total = Number(totalRow?.total ?? 0)

  const leaderboard = await query<{
    rank: number; coins_earned: number; badges_count: number; name: string; user_id: string
  }>(
    `SELECT l.rank, l.coins_earned, l.badges_count, u.name, u.id AS user_id
     FROM leaderboard l
     JOIN users u ON u.id = l.user_id
     ORDER BY (l.rank IS NULL), l.rank
     LIMIT 5`
  )

  const postList = posts.map((p) => ({
    ...p,
    answer_count: Number(p.answer_count),
    accepted_count: Number(p.accepted_count),
  }))
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Hero Banner ── */}
      <div className="dash-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-800 via-indigo-700 to-violet-800 p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 w-72 h-72 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="pointer-events-none absolute top-6 right-52 w-2.5 h-2.5 rounded-full bg-white/25 sparkle-dot" />
        <div className="pointer-events-none absolute bottom-8 right-28 w-1.5 h-1.5 rounded-full bg-white/20 sparkle-dot-2" />
        <div className="pointer-events-none absolute top-1/2 right-1/3 w-2 h-2 rounded-full bg-white/15 sparkle-dot-3" />
        <div className="pointer-events-none absolute top-1/3 right-16 w-1.5 h-1.5 rounded-full bg-amber-300/30 sparkle-dot-4" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest text-indigo-300 uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Learner Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Community{' '}
              <span role="img" aria-label="community">🤝</span>
            </h1>
            <p className="mt-2 text-indigo-200/80 text-sm leading-relaxed">
              Share knowledge, ask questions, and grow together
            </p>
          </div>
          <div className="flex items-stretch gap-3 shrink-0">
            <HeroPill value={total} label="Questions" delay="0.20s" />
            <HeroPill value={leaderboard.length > 0 ? `${leaderboard.length}+` : '0'} label="Top Learners" delay="0.32s" />
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Posts ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Ask a Question CTA */}
          <Link href="/community/post/new">
            <div className="comm-post-card badge-enter group flex items-center justify-between gap-4 bg-white border-2 border-dashed border-indigo-200 rounded-2xl px-6 py-5 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors" style={{ animationDelay: '0.10s' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">
                    Ask a Question
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Share your challenge with the community</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0">
                −10 coins
              </span>
            </div>
          </Link>

          {/* Empty state */}
          {postList.length === 0 ? (
            <div className="dash-fade-up dash-d-3 bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.671 1.09-.085 2.17-.207 3.238-.364 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
              </div>
              <p className="text-gray-700 font-bold mb-1">No questions yet</p>
              <p className="text-gray-400 text-sm">Be the first to ask the community!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {postList.map((post, i) => {
                const initial = post.author_name.charAt(0).toUpperCase()
                const gradient = avatarGradient(post.author_name)
                const answerReward = Math.round(post.coin_cost * 0.5 * 10) / 10
                const isAnswered = post.accepted_count > 0

                return (
                  <div
                    key={post.id}
                    className="comm-post-card badge-enter relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm overflow-hidden"
                    style={{ animationDelay: `${0.15 + i * 0.05}s` }}
                  >
                    {/* Status accent strip */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-0.75 rounded-r-full ${
                        isAnswered ? 'bg-emerald-400' : 'bg-indigo-400'
                      }`}
                    />

                    {/* Author row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full bg-linear-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                        >
                          {initial}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-tight">{post.author_name}</p>
                          <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {isAnswered && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            ✓ Answered
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-amber-600 font-bold text-sm bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg">
                          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
                          </svg>
                          {post.coin_cost}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-gray-900 mb-3 leading-snug">
                      {post.title}
                    </h3>

                    {/* Footer row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.671 1.09-.085 2.17-.207 3.238-.364 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                        {post.answer_count} answer{post.answer_count !== 1 ? 's' : ''}
                      </div>
                      <Link
                        href={`/community/post/${post.id}`}
                        className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1 rounded-lg transition-colors"
                      >
                        Answer · +{answerReward} coins
                      </Link>
                      {post.skill_domain && (
                        <span className="ml-auto text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                          {post.skill_domain}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              {pageNum > 1 && (
                <Link
                  href={`?page=${pageNum - 1}${domain ? `&domain=${domain}` : ''}`}
                  className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-100 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                  Prev
                </Link>
              )}
              <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                {pageNum} / {totalPages}
              </span>
              {pageNum < totalPages && (
                <Link
                  href={`?page=${pageNum + 1}${domain ? `&domain=${domain}` : ''}`}
                  className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-100 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <div className="space-y-4">

          {/* Leaderboard card */}
          <div className="dash-fade-up dash-d-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-gray-900 flex-1">Top Learners</h2>
              <Link href="/community/leaderboard" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                View all →
              </Link>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No data yet — start answering!</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((row, i) => {
                  const isMe = row.user_id === session.userId
                  const initials = row.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  const grad = avatarPalette[i % avatarPalette.length]
                  const medal = rankMedal[row.rank]
                  const badge = rankBadge[row.rank]

                  return (
                    <div
                      key={row.user_id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors ${
                        isMe ? 'bg-indigo-50 ring-1 ring-indigo-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${
                          badge ?? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}
                      >
                        {medal ?? `${row.rank}`}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-full bg-linear-to-br ${grad} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isMe ? 'text-indigo-700' : 'text-gray-900'}`}>
                          {row.name}{isMe ? ' (you)' : ''}
                        </p>
                        <p className="text-[10px] text-gray-400">{Number(row.coins_earned).toLocaleString()} pts</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-bold text-amber-600">{row.badges_count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Stats card */}
          <div className="dash-fade-up dash-d-3 bg-linear-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-5">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-indigo-200 flex items-center justify-center">
                <svg className="w-3 h-3 text-indigo-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5ZM8 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7ZM14 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4Z" />
                </svg>
              </div>
              Community Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Total questions</span>
                <span className="text-sm font-bold text-indigo-700">{total}</span>
              </div>
              <div className="h-px bg-indigo-100" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Current page</span>
                <span className="text-sm font-bold text-indigo-700">{pageNum} / {totalPages || 1}</span>
              </div>
            </div>
          </div>

          {/* Earn coins tips */}
          <div className="dash-fade-up dash-d-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Earn coins by</h3>
            <div className="space-y-2.5">
              {[
                { emoji: '💬', label: 'Answering questions', coin: '+5–50' },
                { emoji: '✅', label: 'Getting answer accepted', coin: '+10–100' },
                { emoji: '🏅', label: 'Completing checkpoints', coin: '+50' },
              ].map(({ emoji, label, coin }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-base shrink-0">{emoji}</span>
                  <span className="text-xs text-gray-600 flex-1 leading-tight">{label}</span>
                  <span className="text-xs font-bold text-emerald-600 shrink-0">{coin}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
