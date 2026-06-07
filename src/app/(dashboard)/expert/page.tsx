import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Expert Sessions — SkillForge' }

const avatarPalette = [
  'from-indigo-500 to-blue-600',
  'from-teal-500 to-cyan-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-400 to-orange-500',
  'from-emerald-500 to-teal-600',
]

const availConfig: Record<string, { dot: string; label: string; pill: string }> = {
  AVAILABLE:   { dot: 'bg-green-400',  label: 'Available',   pill: 'bg-green-100 text-green-700 border-green-200' },
  UNAVAILABLE: { dot: 'bg-red-400',    label: 'Unavailable', pill: 'bg-red-100 text-red-600 border-red-200' },
  ON_LEAVE:    { dot: 'bg-amber-400',  label: 'On Leave',    pill: 'bg-amber-100 text-amber-700 border-amber-200' },
}

export default async function ExpertDirectoryPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const experts = await query<{
    id: string; name: string; field_of_expertise: string
    bio: string | null; availability_status: string; completed_sessions: number
  }>(
    `SELECT ie.id, ie.name, ie.field_of_expertise, ie.bio, ie.availability_status,
            SUM(CASE WHEN es.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_sessions
     FROM industry_experts ie
     LEFT JOIN expert_sessions es ON es.expert_id = ie.id
     GROUP BY ie.id, ie.name, ie.field_of_expertise, ie.bio, ie.availability_status, ie.created_at
     ORDER BY ie.availability_status ASC, ie.created_at DESC`
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-indigo-600 via-violet-600 to-purple-600 px-7 py-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white" />
          <div className="absolute -bottom-12 -left-8 w-64 h-64 rounded-full bg-white" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Expert Sessions</h1>
            <p className="text-indigo-200 text-sm mt-1">Book 1-on-1 sessions with industry professionals · 100 SCS per session</p>
          </div>
          <Link href="/expert/sessions" className="shrink-0 flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            My Sessions
          </Link>
        </div>
      </div>

      {experts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-1.342m-7.48 0a50.761 50.761 0 0 1-1.97.54m13.42-5.24a50.717 50.717 0 0 1 1.97.54" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">No experts available yet</p>
          <p className="text-xs text-gray-400 mt-1">Check back soon</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {experts.map((expert, i) => {
            const avail = availConfig[expert.availability_status] ?? availConfig.UNAVAILABLE
            const grad = avatarPalette[i % avatarPalette.length]
            const isAvailable = expert.availability_status === 'AVAILABLE'
            const completedSessions = Number(expert.completed_sessions)
            return (
              <div key={expert.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${grad} flex items-center justify-center text-white font-bold text-xl shadow-sm`}>
                        {expert.name.charAt(0)}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${avail.dot}`} />
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${avail.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
                      {avail.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">{expert.name}</h3>
                  <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full mb-3">
                    {expert.field_of_expertise}
                  </span>
                  {expert.bio && (
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{expert.bio}</p>
                  )}
                </div>
                <div className="px-5 pb-5">
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 mb-3">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
                      </svg>
                      <span className="text-sm font-bold text-amber-600">100 SCS</span>
                    </div>
                    {completedSessions > 0 && (
                      <span className="text-xs text-gray-400">{completedSessions} session{completedSessions !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {isAvailable ? (
                    <Link href={`/expert/${expert.id}/book`} className="flex items-center justify-center gap-2 w-full bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                      Book Session
                    </Link>
                  ) : (
                    <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed">
                      Not Available
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
