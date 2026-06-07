import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Community — SkillForge' }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} minute${m > 1 ? 's' : ''} ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d > 1 ? 's' : ''} ago`
}

const avatarPalette = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-indigo-600',
  'from-teal-400 to-cyan-500',
  'from-rose-500 to-orange-400',
  'from-violet-500 to-purple-600',
  'from-emerald-400 to-teal-500',
]

function avatarGradient(name: string): string {
  const code = name.charCodeAt(0) % avatarPalette.length
  return avatarPalette[code]
}

const rankStyle: Record<number, string> = {
  1: 'bg-amber-400 text-white border-amber-300',
  2: 'bg-gray-300 text-gray-700 border-gray-200',
  3: 'bg-orange-400 text-white border-orange-300',
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
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-9 h-9 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Community is locked</h1>
        <p className="text-gray-500 text-sm mb-6">Complete at least one full roadmap to unlock the community and connect with other learners.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
          Go to my roadmaps
        </Link>
      </div>
    )
  }

  const { page, domain } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1)
  const offset = (pageNum - 1) * 20
  const domainFilter = domain?.trim() ?? ''

  const domainWherePost = domainFilter ? `AND cp.skill_domain LIKE ?` : ''
  const domainWhereCount = domainFilter ? `AND skill_domain LIKE ?` : ''
  const domainParam = domainFilter ? [`%${domainFilter}%`] : []

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

  const postList = posts.map((p) => ({ ...p, answer_count: Number(p.answer_count), accepted_count: Number(p.accepted_count) }))
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Gradient Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-purple-600 via-fuchsia-500 to-pink-500 px-7 py-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white" />
          <div className="absolute -bottom-14 -left-10 w-64 h-64 rounded-full bg-white" />
        </div>
        <div className="relative">
          <h1 className="text-2xl font-bold">Learner Community</h1>
          <p className="text-purple-100 text-sm mt-1">Share knowledge, ask questions, and grow together</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Ask + Posts */}
        <div className="lg:col-span-2 space-y-4">

          <Link
            href="/community/post/new"
            className="flex items-center justify-center gap-2.5 w-full bg-white border-2 border-dashed border-gray-200 rounded-2xl py-4 text-gray-400 text-sm font-medium hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all group"
          >
            <svg className="w-5 h-5 group-hover:text-purple-500" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V20.5l4.5-4.5h.765" />
            </svg>
            Ask a Question
            <span className="text-xs font-semibold text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Costs 10 coins
            </span>
          </Link>

          {postList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
              <p className="text-gray-400 text-sm">No questions yet. Be the first to ask!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {postList.map((post) => {
                const initial = post.author_name.charAt(0).toUpperCase()
                const gradient = avatarGradient(post.author_name)
                const answerReward = Math.round(post.coin_cost * 0.5 * 10) / 10

                return (
                  <div key={post.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-purple-100 transition-all">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-linear-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                          {initial}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{post.author_name}</p>
                          <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
                        </svg>
                        <span className="text-sm font-bold text-amber-600">{post.coin_cost}</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 mb-3 leading-snug">{post.title}</h3>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.671 1.09-.085 2.17-.207 3.238-.364 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                        <span>{post.answer_count} answer{post.answer_count !== 1 ? 's' : ''}</span>
                      </div>
                      <Link
                        href={`/community/post/${post.id}`}
                        className="text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        Answer (+{answerReward} coins)
                      </Link>
                      {post.skill_domain && (
                        <span className="ml-auto text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {post.skill_domain}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              {pageNum > 1 && (
                <Link href={`?page=${pageNum - 1}${domain ? `&domain=${domain}` : ''}`}
                  className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                  Prev
                </Link>
              )}
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                Page {pageNum} of {totalPages}
              </span>
              {pageNum < totalPages && (
                <Link href={`?page=${pageNum + 1}${domain ? `&domain=${domain}` : ''}`}
                  className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors">
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right: Leaderboard */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
              </svg>
              <h2 className="text-base font-bold text-gray-900">Leaderboard</h2>
              <Link href="/community/leaderboard" className="ml-auto text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                View all
              </Link>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No data yet — start answering!</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((row, i) => {
                  const isMe = row.user_id === session.userId
                  const rankBg = rankStyle[row.rank] ?? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                  const initials = row.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  const grad = avatarPalette[i % avatarPalette.length]

                  return (
                    <div
                      key={row.user_id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${isMe ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${rankBg}`}>
                        #{row.rank}
                      </span>
                      <div className={`w-9 h-9 rounded-full bg-linear-to-br ${grad} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isMe ? 'text-purple-700' : 'text-gray-900'}`}>
                          {row.name}{isMe ? ' (you)' : ''}
                        </p>
                        <p className="text-xs text-gray-400">{Number(row.coins_earned).toLocaleString()} points</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-bold text-amber-600">{row.badges_count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Community Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total questions</span>
                <span className="font-semibold text-gray-900">{total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Showing page</span>
                <span className="font-semibold text-gray-900">{pageNum} / {totalPages || 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
