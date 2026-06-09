import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Leaderboard — SkillForge' }

const avatarPalette = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-teal-400 to-cyan-500',
  'from-rose-500 to-orange-400',
  'from-purple-500 to-pink-500',
  'from-emerald-400 to-teal-500',
]

type Row = {
  rank: number
  questions_posted: number
  coins_earned: number
  badges_count: number
  name: string
  user_id: string
}

function Avatar({ name, index, size = 'md' }: { name: string; index: number; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const grad = avatarPalette[index % avatarPalette.length]
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs'
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  )
}

export default async function LeaderboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const rows = await query<Row>(
    `SELECT
       u.id                                                                          AS user_id,
       u.name,
       p.total_coins_earned                                                          AS coins_earned,
       RANK() OVER (ORDER BY p.total_coins_earned DESC, u.name ASC)                 AS \`rank\`,
       COALESCE(qst.questions_posted, 0)                                             AS questions_posted,
       COALESCE(bdg.badges_count,     0)                                             AS badges_count
     FROM users u
     JOIN profiles p ON p.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS questions_posted
       FROM community_posts
       GROUP BY user_id
     ) qst ON qst.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS badges_count
       FROM badges GROUP BY user_id
     ) bdg ON bdg.user_id = u.id
     ORDER BY p.total_coins_earned DESC, u.name ASC
     LIMIT 50`
  )

  const myRank = rows.find((r) => r.user_id === session.userId)
  const myRankFallback = myRank ? null : await query<{
    rank: number; coins_earned: number; questions_posted: number
  }>(
    `SELECT
       CAST(
         (SELECT COUNT(*) FROM profiles p2 WHERE p2.total_coins_earned > p.total_coins_earned) + 1
       AS UNSIGNED)                                                                 AS \`rank\`,
       p.total_coins_earned                                                         AS coins_earned,
       COALESCE((SELECT COUNT(*) FROM community_posts WHERE user_id = ?), 0)       AS questions_posted
     FROM profiles p WHERE p.user_id = ?`,
    [session.userId, session.userId]
  ).then((r) => r[0] ?? null)

  const myEntry = myRank ?? (myRankFallback ? { ...myRankFallback, user_id: session.userId, name: '' } : null)

  const top3 = rows.slice(0, 3)
  const rest = rows.slice(3)

  // Podium order: 2nd (left), 1st (center), 3rd (right)
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Hero Banner ── */}
      <div className="dash-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 p-8 text-white shadow-2xl">
        {/* background blobs */}
        <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 w-72 h-72 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-1/3 w-48 h-48 rounded-full bg-indigo-300/5 blur-2xl" />
        {/* sparkle dots */}
        <div className="pointer-events-none absolute top-6 right-36 w-2 h-2 rounded-full bg-white/30 sparkle-dot" />
        <div className="pointer-events-none absolute bottom-8 right-20 w-1.5 h-1.5 rounded-full bg-amber-300/50 sparkle-dot-3" />
        <div className="pointer-events-none absolute top-1/2 right-1/4 w-1.5 h-1.5 rounded-full bg-white/20 sparkle-dot-2" />
        <div className="pointer-events-none absolute top-8 left-1/3 w-1 h-1 rounded-full bg-violet-300/40 sparkle-dot-4" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest text-indigo-300 uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Community Rankings
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-2 flex items-center gap-3">
              Leaderboard
              <span className="lb-crown-anim inline-block">🏆</span>
            </h1>
            <p className="text-indigo-200/80 text-sm max-w-xs">
              Top contributors ranked by coins earned. Keep posting to climb the ranks!
            </p>
          </div>

          {myEntry && (
            <div className="flex flex-col gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-4 shrink-0">
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Your Standing</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-white">#{myEntry.rank}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-indigo-200 mt-0.5">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1.75l2.61 5.29 5.83.85-4.22 4.11.996 5.81L12 14.9l-5.216 2.74.996-5.81L3.56 7.89l5.83-.85L12 1.75z"/>
                  </svg>
                  {Number(myEntry.coins_earned).toLocaleString()} pts
                </span>
                <span className="w-px h-3 bg-white/20" />
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-indigo-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                  {myEntry.questions_posted ?? 0} questions
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back link */}
      <Link
        href="/community/feed"
        className="dash-fade-up dash-d-1 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Community Feed
      </Link>

      {rows.length === 0 ? (
        <div className="dash-fade-up dash-d-2 bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🏆</div>
          <p className="text-gray-700 font-bold text-lg mb-1">No leaderboard data yet</p>
          <p className="text-sm text-gray-400 mb-6">Be the first to post questions and climb the ranks!</p>
          <Link
            href="/community/feed"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
          >
            Go to Community
          </Link>
        </div>
      ) : (
        <>
          {/* ── Top 3 Podium ── */}
          {top3.length > 0 && (
            <div className="dash-fade-up dash-d-2 grid grid-cols-3 gap-3 items-end">
              {podiumOrder.map((row, podiumIdx) => {
                if (!row) return <div key={podiumIdx} />
                const isFirst = row.rank === 1
                const isMe = row.user_id === session.userId
                const delay = [0.12, 0.06, 0.18][podiumIdx]

                const medalConfig: Record<number, { medal: string; gradient: string; border: string; shadow: string; height: string }> = {
                  1: {
                    medal: '🥇',
                    gradient: 'from-amber-400 via-yellow-300 to-amber-500',
                    border: 'border-amber-300',
                    shadow: 'shadow-amber-200/60',
                    height: 'pt-8 pb-6',
                  },
                  2: {
                    medal: '🥈',
                    gradient: 'from-slate-400 via-slate-300 to-slate-400',
                    border: 'border-slate-300',
                    shadow: 'shadow-slate-200/50',
                    height: 'pt-5 pb-5',
                  },
                  3: {
                    medal: '🥉',
                    gradient: 'from-orange-400 via-amber-300 to-orange-500',
                    border: 'border-orange-300',
                    shadow: 'shadow-orange-200/50',
                    height: 'pt-5 pb-5',
                  },
                }

                const mc = medalConfig[row.rank]

                return (
                  <div
                    key={row.user_id}
                    className={`lb-podium-card lb-podium-in rounded-2xl border ${mc.border} shadow-lg ${mc.shadow} bg-white flex flex-col items-center text-center gap-2 px-3 ${mc.height}`}
                    style={{ animationDelay: `${delay}s` }}
                  >
                    {/* Crown / medal */}
                    <span className={`text-2xl ${isFirst ? 'lb-crown-anim inline-block' : ''}`}>{mc.medal}</span>

                    {/* Avatar with gradient ring */}
                    <div className={`p-0.5 rounded-full bg-gradient-to-br ${mc.gradient}`}>
                      <div className="bg-white p-0.5 rounded-full">
                        <Avatar name={row.name} index={rows.indexOf(row)} size={isFirst ? 'lg' : 'md'} />
                      </div>
                    </div>

                    {/* Name */}
                    <div className="min-w-0 w-full">
                      <p className={`font-extrabold truncate ${isFirst ? 'text-base' : 'text-sm'} text-gray-900`}>
                        {row.name}
                        {isMe && (
                          <span className="ml-1 text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full align-middle">
                            you
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Coins */}
                    <div className={`flex items-center gap-1 ${isFirst ? 'text-amber-500' : 'text-slate-500'}`}>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1.75l2.61 5.29 5.83.85-4.22 4.11.996 5.81L12 14.9l-5.216 2.74.996-5.81L3.56 7.89l5.83-.85L12 1.75z"/>
                      </svg>
                      <span className="text-sm font-bold">{Number(row.coins_earned).toLocaleString()}</span>
                    </div>

                    {/* Questions */}
                    <span className="text-[10px] text-gray-400 font-medium">
                      {row.questions_posted} question{row.questions_posted !== 1 ? 's' : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Ranks 4–50 ── */}
          {rest.length > 0 && (
            <div className="dash-fade-up dash-d-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Column header */}
              <div className="flex items-center gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <span className="w-10 text-center">Rank</span>
                <span className="w-11 shrink-0" />
                <span className="flex-1">Name</span>
                <span className="hidden sm:block w-24 text-right">Questions</span>
                <span className="w-24 text-right">Points</span>
              </div>

              {rest.map((row, i) => {
                const isMe = row.user_id === session.userId
                const globalIdx = i + 3

                return (
                  <div
                    key={row.user_id}
                    className={`lb-row lb-row-in flex items-center gap-4 px-5 py-3.5 ${
                      i > 0 ? 'border-t border-gray-50' : ''
                    } ${isMe ? 'bg-indigo-50/70' : ''}`}
                    style={{ animationDelay: `${0.28 + i * 0.035}s` }}
                  >
                    {/* Left accent for current user */}
                    {isMe && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 rounded-r-full" />
                    )}

                    {/* Rank */}
                    <span className="w-10 text-center text-sm font-bold text-gray-400 shrink-0">
                      #{row.rank}
                    </span>

                    {/* Avatar */}
                    <Avatar name={row.name} index={globalIdx} size="sm" />

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isMe ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {row.name}
                        {isMe && (
                          <span className="ml-1.5 text-[9px] font-bold text-indigo-400 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                            you
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Questions */}
                    <div className="hidden sm:flex items-center justify-end gap-1 w-24 shrink-0">
                      <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                      </svg>
                      <span className="text-sm font-semibold text-indigo-600">{row.questions_posted}</span>
                    </div>

                    {/* Points */}
                    <div className="flex items-center justify-end gap-1 w-24 shrink-0">
                      <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1.75l2.61 5.29 5.83.85-4.22 4.11.996 5.81L12 14.9l-5.216 2.74.996-5.81L3.56 7.89l5.83-.85L12 1.75z"/>
                      </svg>
                      <span className="text-sm font-semibold text-gray-700">{Number(row.coins_earned).toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {rows.length > 0 && (
        <p className="text-xs text-gray-400 text-center dash-fade-up pb-2">
          Rankings update in real time · Sorted by coins earned
        </p>
      )}
    </div>
  )
}
