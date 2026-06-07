import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Expert — SkillForge' }

const availConfig: Record<string, { dot: string; label: string; pill: string }> = {
  AVAILABLE:   { dot: 'bg-green-400',  label: 'Available',   pill: 'bg-green-100 text-green-700 border-green-200' },
  UNAVAILABLE: { dot: 'bg-red-400',    label: 'Unavailable', pill: 'bg-red-100 text-red-600 border-red-200' },
  ON_LEAVE:    { dot: 'bg-amber-400',  label: 'On Leave',    pill: 'bg-amber-100 text-amber-700 border-amber-200' },
}

export default async function ExpertProfilePage({ params }: { params: Promise<{ expertId: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { expertId } = await params

  const [expert] = await query<{ id: string; name: string; field_of_expertise: string; bio: string | null; availability_status: string }>(
    `SELECT id, name, field_of_expertise, bio, availability_status FROM industry_experts WHERE id = ?`,
    [expertId]
  )
  if (!expert) notFound()

  const [profile] = await query<{ coin_balance: number }>(
    `SELECT coin_balance FROM profiles WHERE user_id = ?`,
    [session.userId]
  )

  const [sessionRow] = await query<{ session_count: number }>(
    `SELECT COUNT(*) AS session_count FROM expert_sessions WHERE expert_id = ? AND status = 'COMPLETED'`,
    [expertId]
  )

  const coinBalance = profile?.coin_balance ?? 0
  const canBook = coinBalance >= 100
  const avail = availConfig[expert.availability_status] ?? availConfig.UNAVAILABLE
  const isAvailable = expert.availability_status === 'AVAILABLE'
  const shortfall = 100 - coinBalance
  const sessionCount = Number(sessionRow?.session_count ?? 0)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link href="/expert" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        All Experts
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-24 bg-linear-to-r from-indigo-600 via-violet-600 to-purple-600" />

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg ring-4 ring-white">
                {expert.name.charAt(0)}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${avail.dot}`} />
            </div>
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${avail.pill}`}>
              <span className={`w-2 h-2 rounded-full ${avail.dot}`} />
              {avail.label}
            </span>
          </div>

          <h1 className="text-xl font-bold text-gray-900">{expert.name}</h1>
          <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full mt-1 mb-4">
            {expert.field_of_expertise}
          </span>

          {sessionCount > 0 && (
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
                <span><strong className="text-gray-900">{sessionCount}</strong> completed session{sessionCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {expert.bio && (
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">About</p>
              <p className="text-sm text-gray-700 leading-relaxed">{expert.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-indigo-50 rounded-xl p-3 text-center">
              <svg className="w-5 h-5 text-indigo-500 mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="text-sm font-bold text-gray-900">30 min</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <svg className="w-5 h-5 text-amber-500 mx-auto mb-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
              </svg>
              <p className="text-xs text-gray-500">Cost</p>
              <p className="text-sm font-bold text-amber-600">100 SCS</p>
            </div>
            <div className="bg-violet-50 rounded-xl p-3 text-center">
              <svg className="w-5 h-5 text-violet-500 mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <p className="text-xs text-gray-500">Format</p>
              <p className="text-sm font-bold text-gray-900">Online</p>
            </div>
          </div>

          {!canBook && isAvailable && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4">
              <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Need {shortfall} more SCS</p>
                <p className="text-xs text-amber-700 mt-0.5">Complete tasks and roadmap checkpoints to earn coins.</p>
              </div>
            </div>
          )}

          {isAvailable ? (
            <Link
              href={canBook ? `/expert/${expert.id}/book` : '#'}
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                canBook
                  ? 'bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 pointer-events-none'
              }`}
            >
              {canBook ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  Book Session · 100 SCS
                </>
              ) : 'Insufficient coins'}
            </Link>
          ) : (
            <button disabled className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-400 cursor-not-allowed">
              Expert Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
