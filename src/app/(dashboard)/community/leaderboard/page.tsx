import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Leaderboard — SkillForge' }

const avatarPalette = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-indigo-600',
  'from-teal-400 to-cyan-500',
  'from-rose-500 to-orange-400',
  'from-violet-500 to-purple-600',
  'from-emerald-400 to-teal-500',
]

const rankStyle: Record<number, string> = {
  1: 'bg-amber-400 text-white border-amber-300',
  2: 'bg-gray-300 text-gray-700 border-gray-200',
  3: 'bg-orange-400 text-white border-orange-300',
}

export default async function LeaderboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const rows = await query<{
    rank: number; total_answers: number; coins_earned: number;
    badges_count: number; updated_at: string; name: string; user_id: string
  }>(
    `SELECT l.rank, l.total_answers, l.coins_earned, l.badges_count, l.updated_at,
            u.name, u.id AS user_id
     FROM leaderboard l
     JOIN users u ON u.id = l.user_id
     ORDER BY (l.rank IS NULL), l.rank
     LIMIT 50`
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-sm text-gray-500">Top community contributors</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
          <p className="text-sm text-gray-400">No data yet. Start answering questions to appear here!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {rows.map((row, i) => {
            const isMe = row.user_id === session.userId
            const rankBg = rankStyle[row.rank] ?? 'bg-indigo-100 text-indigo-700 border-indigo-200'
            const initials = row.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            const grad = avatarPalette[i % avatarPalette.length]

            return (
              <div
                key={row.user_id}
                className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-gray-50' : ''} ${isMe ? 'bg-purple-50' : 'hover:bg-gray-50'} transition-colors`}
              >
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${rankBg}`}>
                  #{row.rank}
                </span>
                <div className={`w-10 h-10 rounded-full bg-linear-to-br ${grad} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isMe ? 'text-purple-700' : 'text-gray-900'}`}>
                    {row.name}{isMe ? ' (you)' : ''}
                  </p>
                  <p className="text-xs text-gray-400">{Number(row.coins_earned).toLocaleString()} points</p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="text-sm font-bold text-purple-600">{row.total_answers}</p>
                  <p className="text-[10px] text-gray-400">answers</p>
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

      {rows.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Last updated: {new Date(rows[0].updated_at).toLocaleString()}
        </p>
      )}
    </div>
  )
}
