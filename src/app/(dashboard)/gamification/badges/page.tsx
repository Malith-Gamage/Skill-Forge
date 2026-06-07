import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Badges — SkillForge' }

const badgeInfo: Record<string, { label: string; color: string; emoji: string }> = {
  CHECKPOINT: { label: 'Checkpoint', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', emoji: '🎯' },
  GOLDEN: { label: 'Golden', color: 'bg-amber-100 text-amber-700 border-amber-200', emoji: '🏆' },
  COMMUNITY_HELPER: { label: 'Helper', color: 'bg-green-100 text-green-700 border-green-200', emoji: '🤝' },
  COMMUNITY_MENTOR: { label: 'Mentor', color: 'bg-purple-100 text-purple-700 border-purple-200', emoji: '🌟' },
  COMMUNITY_CHAMPION: { label: 'Champion', color: 'bg-rose-100 text-rose-700 border-rose-200', emoji: '👑' },
}

export default async function BadgesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const badges = await query<{
    id: string; badge_type: string; is_golden: boolean; shareable_slug: string;
    awarded_at: string; checkpoint_title: string | null; roadmap_title: string | null
  }>(
    `SELECT b.id, b.badge_type, b.is_golden, b.shareable_slug, b.awarded_at,
            c.title AS checkpoint_title, r.title AS roadmap_title
     FROM badges b
     LEFT JOIN checkpoints c ON c.id = b.checkpoint_id
     LEFT JOIN roadmaps r ON r.id = c.roadmap_id
     WHERE b.user_id = ?
     ORDER BY b.awarded_at DESC`,
    [session.userId]
  )

  const golden = badges.filter((b) => b.is_golden)
  const checkpoint = badges.filter((b) => b.badge_type === 'CHECKPOINT')
  const community = badges.filter((b) => b.badge_type.startsWith('COMMUNITY_'))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Badges</h1>
        <p className="text-sm text-gray-500 mt-0.5">{badges.length} badge{badges.length !== 1 ? 's' : ''} earned</p>
      </div>

      {badges.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <svg className="w-9 h-9 text-indigo-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">No badges yet</h2>
          <p className="text-sm text-gray-500">Complete checkpoints and roadmaps to earn badges</p>
        </div>
      )}

      {golden.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Golden Badges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {golden.map((b) => (
              <div key={b.shareable_slug} className="bg-linear-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs text-amber-600 font-medium">{new Date(b.awarded_at).toLocaleDateString()}</span>
                </div>
                <p className="font-bold text-gray-900 mb-0.5">{b.roadmap_title ?? 'Roadmap Complete!'}</p>
                <p className="text-xs text-amber-700 mb-3">Golden Badge</p>
                <Link
                  href={`/achievements/${b.shareable_slug}`}
                  className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium underline"
                >
                  Share achievement →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {checkpoint.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Checkpoint Badges</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {checkpoint.map((b, i) => (
              <div key={i} className="bg-white rounded-xl border border-indigo-100 p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-900 line-clamp-2">{b.checkpoint_title ?? 'Checkpoint'}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(b.awarded_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {community.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Community Badges</h2>
          <div className="flex flex-wrap gap-3">
            {community.map((b, i) => {
              const info = badgeInfo[b.badge_type] ?? { label: b.badge_type, color: 'bg-gray-100 text-gray-700 border-gray-200', emoji: '🏅' }
              return (
                <div key={i} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold ${info.color}`}>
                  <span>{info.emoji}</span>
                  <span>{info.label}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
