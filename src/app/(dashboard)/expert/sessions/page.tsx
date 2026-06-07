import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'My Sessions — SkillForge' }

const statusConfig: Record<string, { label: string; pill: string; dot: string }> = {
  PENDING:   { label: 'Pending',   pill: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  CONFIRMED: { label: 'Confirmed', pill: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-400' },
  COMPLETED: { label: 'Completed', pill: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-400' },
  CANCELLED: { label: 'Cancelled', pill: 'bg-red-100 text-red-600 border-red-200',        dot: 'bg-red-400' },
}

const avatarPalette = [
  'from-indigo-500 to-blue-600',
  'from-teal-500 to-cyan-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-400 to-orange-500',
  'from-emerald-500 to-teal-600',
]

export default async function MySessionsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const sessions = await query<{
    id: string; skill_domain: string; scheduled_date: string; status: string
    coin_cost: number; notes: string | null; meeting_link: string | null
    created_at: string; expert_name: string; field_of_expertise: string
  }>(
    `SELECT es.id, es.skill_domain, es.scheduled_date, es.status, es.coin_cost,
            es.notes, es.meeting_link, es.created_at,
            ie.name AS expert_name, ie.field_of_expertise
     FROM expert_sessions es
     JOIN industry_experts ie ON ie.id = es.expert_id
     WHERE es.user_id = ?
     ORDER BY es.scheduled_date DESC`,
    [session.userId]
  )

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your booked expert sessions</p>
        </div>
        <Link
          href="/expert"
          className="flex items-center gap-1.5 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Browse Experts
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1">No sessions yet</p>
          <p className="text-sm text-gray-400 mb-5">Book a 1-on-1 session with an industry expert to get started</p>
          <Link href="/expert" className="inline-flex items-center gap-2 bg-linear-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm">
            Browse Experts
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s, i) => {
            const cfg = statusConfig[s.status] ?? statusConfig.PENDING
            const grad = avatarPalette[i % avatarPalette.length]
            const scheduledDate = new Date(s.scheduled_date)
            const isPast = scheduledDate < new Date()

            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${grad} flex items-center justify-center text-white font-bold text-base shrink-0`}>
                        {s.expert_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{s.expert_name}</p>
                        <p className="text-xs text-indigo-600 font-medium">{s.field_of_expertise}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${cfg.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Topic</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{s.skill_domain}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Scheduled</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {scheduledDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {scheduledDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        {isPast && s.status === 'PENDING' && <span className="ml-1 text-amber-500">(past)</span>}
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Cost</p>
                      <p className="text-sm font-bold text-amber-600">{s.coin_cost} SCS</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Booked on</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {s.notes && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-3 mb-4">
                      <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{s.notes}</p>
                    </div>
                  )}
                </div>

                {s.meeting_link && s.status === 'CONFIRMED' && (
                  <div className="px-5 pb-5">
                    <a
                      href={s.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
