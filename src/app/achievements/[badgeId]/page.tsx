import { query } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ badgeId: string }>
}): Promise<Metadata> {
  const { badgeId } = await params
  const [badge] = await query<{ awarded_at: string; user_name: string; roadmap_title: string | null }>(
    `SELECT b.awarded_at, u.name AS user_name, r.title AS roadmap_title
     FROM badges b
     JOIN users u ON u.id = b.user_id
     LEFT JOIN checkpoints c ON c.id = b.checkpoint_id
     LEFT JOIN roadmaps r ON r.id = c.roadmap_id
     WHERE b.shareable_slug = ? AND b.is_golden = 1`,
    [badgeId]
  )
  if (!badge) return { title: 'Achievement — SkillForge' }

  return {
    title: `${badge.user_name} earned a Golden Badge — SkillForge`,
    description: `${badge.user_name} completed${badge.roadmap_title ? ` "${badge.roadmap_title}"` : ' a full learning roadmap'} on SkillForge.`,
    openGraph: {
      title: `🏆 ${badge.user_name} earned a Golden Badge!`,
      description: `Completed${badge.roadmap_title ? ` "${badge.roadmap_title}"` : ' a full learning roadmap'} on SkillForge — the AI-powered learning platform.`,
      type: 'website',
    },
  }
}

export default async function AchievementPage({
  params,
}: {
  params: Promise<{ badgeId: string }>
}) {
  const { badgeId } = await params

  const [badge] = await query<{
    id: string; awarded_at: string; shareable_slug: string;
    user_name: string; roadmap_title: string | null; skill_domain: string | null
  }>(
    `SELECT b.id, b.awarded_at, b.shareable_slug,
            u.name AS user_name,
            r.title AS roadmap_title, r.skill_domain
     FROM badges b
     JOIN users u ON u.id = b.user_id
     LEFT JOIN checkpoints c ON c.id = b.checkpoint_id
     LEFT JOIN roadmaps r ON r.id = c.roadmap_id
     WHERE b.shareable_slug = ? AND b.is_golden = 1`,
    [badgeId]
  )

  if (!badge) notFound()

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-yellow-50 to-orange-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">SkillForge</span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-amber-200 p-8 mb-6">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-200">
              <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Golden Badge</h1>
          <p className="text-sm text-gray-500 mb-6">Awarded for completing a full learning roadmap</p>

          <div className="bg-amber-50 rounded-2xl p-5 mb-6">
            <p className="text-lg font-bold text-gray-900">{badge.user_name}</p>
            {badge.roadmap_title && (
              <p className="text-sm text-amber-700 mt-1 font-medium">{badge.roadmap_title}</p>
            )}
            {badge.skill_domain && (
              <p className="text-xs text-gray-400 mt-0.5">{badge.skill_domain}</p>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Awarded on {new Date(badge.awarded_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-2 break-all">
            {badge.shareable_slug}
          </div>
        </div>

        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
        >
          Start your own journey →
        </Link>
      </div>
    </div>
  )
}
