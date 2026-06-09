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

const rankConfig: Record<number, { badge: string; medal: string; row: string }> = {
  1: {
    badge: 'bg-amber-400 text-white border-amber-300 shadow-md shadow-amber-100',
    medal: '🥇',
    row: 'bg-amber-50/60',
  },
  2: {
    badge: 'bg-slate-300 text-slate-700 border-slate-200',
    medal: '🥈',
    row: 'bg-slate-50/60',
  },
  3: {
    badge: 'bg-orange-400 text-white border-orange-300',
    medal: '🥉',
    row: 'bg-orange-50/50',
  },
}

export default async function LeaderboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const rows = await query<{
    rank: number; total_answers: number; coins_earned: number;
    badges_count: number; name: string; user_id: string
  }>(
    `SELECT
       u.id                                                                   AS user_id,
       u.name,
       p.total_coins_earned                                                   AS coins_earned,
       RANK() OVER (ORDER BY p.total_coins_earned DESC, u.name ASC)          AS \`rank\`,
       COALESCE(ans.total_answers, 0)                                        AS total_answers,
       COALESCE(bdg.badges_count,  0)                                        AS badges_count
     FROM users u
     JOIN profiles p ON p.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS total_answers
       FROM community_answers WHERE is_accepted = 1
       GROUP BY user_id
     ) ans ON ans.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS badges_count
       FROM badges GROUP BY user_id
     ) bdg ON bdg.user_id = u.id
     ORDER BY p.total_coins_earned DESC, u.name ASC
     LIMIT 50`
  )

  // If current user is outside top-50, fetch their rank separately
  const myRank = rows.find((r) => r.user_id === session.userId)
  const myRankFallback = myRank ? null : await query<{
    rank: number; coins_earned: number; total_answers: number
  }>(
    `SELECT
       CAST(
         (SELECT COUNT(*) FROM profiles p2 WHERE p2.total_coins_earned > p.total_coins_earned) + 1
       AS UNSIGNED)                                                           AS \`rank\`,
       p.total_coins_earned                                                   AS coins_earned,
       COALESCE((
         SELECT COUNT(*) FROM community_answers
         WHERE user_id = ? AND is_accepted = 1
       ), 0)                                                                  AS total_answers
     FROM profiles p WHERE p.user_id = ?`,
    [session.userId, session.userId]
  ).then((r) => r[0] ?? null)

  const myEntry = myRank ?? (myRankFallback ? { ...myRankFallback, user_id: session.userId, name: '' } : null)

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Hero Banner ── */}
      <div className="dash-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-800 via-indigo-700 to-violet-800 p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -top-20 -right-12 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="pointer-events-none absolute top-5 right-32 w-2 h-2 rounded-full bg-white/25 sparkle-dot" />
        <div className="pointer-events-none absolute bottom-6 right-16 w-1.5 h-1.5 rounded-full bg-amber-300/40 sparkle-dot-3" />
        <div className="pointer-events-none absolute top-1/2 right-1/4 w-1.5 h-1.5 rounded-full bg-white/20 sparkle-dot-2" />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest text-indigo-300 uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Community Rankings
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mb-1">
            Leaderboard{' '}
            <span role="img" aria-label="trophy">🏆</span>
          </h1>
          <p className="text-indigo-200/80 text-sm">
            Top contributors ranked by coins earned
          </p>

          {myEntry && (
            <div className="mt-5 inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5">
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Your rank</span>
              <span className="text-xl font-extrabold text-white">#{myEntry.rank}</span>
              <span className="w-px h-4 bg-white/20" />
              <span className="text-xs text-indigo-200">{Number(myEntry.coins_earned).toLocaleString()} pts</span>
              <span className="w-px h-4 bg-white/20" />
              <span className="text-xs text-indigo-200">{myEntry.total_answers} answers</span>
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
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-700 font-bold mb-1">No leaderboard data yet</p>
          <p className="text-sm text-gray-400 mb-5">Start answering questions to appear here!</p>
          <Link
            href="/community/feed"
            className="inline-flex items-center gap-2 bg-linear-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
          >
            Go to Community
          </Link>
        </div>
      ) : (
        <div className="dash-fade-up dash-d-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {rows.map((row, i) => {
            const isMe = row.user_id === session.userId
            const rc = rankConfig[row.rank]
            const initials = row.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            const grad = avatarPalette[i % avatarPalette.length]

            return (
              <div
                key={row.user_id}
                className={`flex items-center gap-4 px-5 py-4 tx-row-in ${
                  i > 0 ? 'border-t border-gray-50' : ''
                } ${
                  isMe
                    ? 'bg-indigo-50'
                    : rc?.row ?? 'hover:bg-gray-50'
                } transition-colors`}
                style={{ animationDelay: `${Math.min(0.05 + i * 0.04, 0.8)}s` }}
              >
                {/* Left accent for current user */}
                {isMe && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.75 bg-indigo-500 rounded-r-full" />
                )}

                {/* Rank badge */}
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 border ${
                    rc?.badge ?? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  }`}
                >
                  {row.rank <= 3 ? rc?.medal : `#${row.rank}`}
                </span>

                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full bg-linear-to-br ${grad} flex items-center justify-center text-white text-sm font-bold shrink-0`}
                >
                  {initials}
                </div>

                {/* Name + points */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isMe ? 'text-indigo-700' : 'text-gray-900'}`}>
                    {row.name}
                    {isMe && (
                      <span className="ml-1.5 text-[10px] font-bold text-indigo-400 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                        you
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{Number(row.coins_earned).toLocaleString()} points</p>
                </div>

                {/* Answers */}
                <div className="text-center hidden sm:block">
                  <p className="text-sm font-bold text-indigo-600">{row.total_answers}</p>
                  <p className="text-[10px] text-gray-400">answers</p>
                </div>

                {/* Badges */}
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

      {rows.length > 0 && (
        <p className="text-xs text-gray-400 text-center dash-fade-up dash-d-3">
          Rankings update in real time based on coins earned
        </p>
      )}
    </div>
  )
}
