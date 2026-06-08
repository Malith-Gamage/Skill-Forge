import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BookingActions from '@/components/expert/BookingActions'

export const metadata = { title: 'Manage Bookings — SkillForge' }

const statusConfig: Record<string, { label: string; pill: string; dot: string }> = {
  PENDING:   { label: 'Awaiting response', pill: 'bg-amber-100 text-amber-700 border-amber-200',  dot: 'bg-amber-400' },
  CONFIRMED: { label: 'Confirmed',         pill: 'bg-green-100 text-green-700 border-green-200',  dot: 'bg-green-400' },
  CANCELLED: { label: 'Declined',          pill: 'bg-red-100 text-red-600 border-red-200',        dot: 'bg-red-400' },
  COMPLETED: { label: 'Completed',         pill: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-400' },
}

const avatarPalette = [
  'from-indigo-500 to-blue-600',
  'from-teal-500 to-cyan-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-400 to-orange-500',
  'from-emerald-500 to-teal-600',
]

export default async function ExpertMyBookingsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Confirm the user has an expert profile
  let expertId: string | null = null
  let expertName: string | null = null
  try {
    const [mapping] = await query<{ expert_id: string }>(
      `SELECT expert_id FROM user_expert_map WHERE user_id = ? LIMIT 1`,
      [session.userId],
    )
    if (mapping) {
      expertId = mapping.expert_id
      const [expertRow] = await query<{ name: string }>(
        `SELECT name FROM industry_experts WHERE id = ? LIMIT 1`,
        [expertId],
      )
      expertName = expertRow?.name ?? null
    }
  } catch {
    expertId = null
  }

  if (!expertId) redirect('/expert')

  const bookings = await query<{
    id: string; status: string; skill_domain: string | null
    scheduled_date: string; duration_minutes: number; coin_cost: number
    notes: string | null; meeting_link: string | null; created_at: string
    learner_name: string; learner_email: string
  }>(
    `SELECT es.id, es.status, es.skill_domain, es.scheduled_date, es.duration_minutes,
            es.coin_cost, es.notes, es.meeting_link, es.created_at,
            u.name AS learner_name, u.email AS learner_email
     FROM expert_sessions es
     JOIN users u ON u.id = es.user_id
     WHERE es.expert_id = ?
     ORDER BY FIELD(es.status, 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'), es.scheduled_date ASC`,
    [expertId],
  )

  const pending = bookings.filter((b) => b.status === 'PENDING')
  const others  = bookings.filter((b) => b.status !== 'PENDING')

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/expert"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors font-medium mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to Experts
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">Manage Bookings</h1>
          {expertName && (
            <p className="text-sm text-gray-500 mt-0.5">Sessions booked with <span className="font-semibold text-gray-700">{expertName}</span></p>
          )}
        </div>
        {pending.length > 0 && (
          <div className="shrink-0 flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl mt-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-sm font-bold text-amber-700">{pending.length} pending</span>
          </div>
        )}
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1">No bookings yet</p>
          <p className="text-sm text-gray-400">Learners who book sessions with you will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Pending — needs action */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Awaiting Your Response
              </h2>
              <div className="space-y-3">
                {pending.map((b, i) => <BookingCard key={b.id} booking={b} index={i} showActions />)}
              </div>
            </div>
          )}

          {/* All other bookings */}
          {others.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">History</h2>
              <div className="space-y-3">
                {others.map((b, i) => <BookingCard key={b.id} booking={b} index={i + pending.length} showActions={false} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BookingCard({
  booking: b,
  index,
  showActions,
}: {
  booking: {
    id: string; status: string; skill_domain: string | null
    scheduled_date: string; duration_minutes: number; coin_cost: number
    notes: string | null; meeting_link: string | null; created_at: string
    learner_name: string; learner_email: string
  }
  index: number
  showActions: boolean
}) {
  const cfg = statusConfig[b.status] ?? statusConfig.PENDING
  const grad = avatarPalette[index % avatarPalette.length]
  const scheduledDate = new Date(b.scheduled_date)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5">
        {/* Top row: learner + status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${grad} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
              {b.learner_name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{b.learner_name}</p>
              <p className="text-xs text-gray-400">{b.learner_email}</p>
            </div>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${cfg.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Topic</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{b.skill_domain ?? 'General session'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Scheduled</p>
            <p className="text-sm font-semibold text-gray-800">
              {scheduledDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-xs text-gray-400">
              {scheduledDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Session fee</p>
            <p className="text-sm font-bold text-amber-600">{b.coin_cost.toLocaleString()} SCS</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Requested</p>
            <p className="text-sm font-semibold text-gray-800">
              {new Date(b.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {b.notes && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-3 mb-4">
            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide mb-1">Notes from learner</p>
            <p className="text-sm text-gray-700 leading-relaxed">{b.notes}</p>
          </div>
        )}

        {b.meeting_link && b.status === 'CONFIRMED' && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-3.5 py-2.5 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            <a href={b.meeting_link} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold text-green-700 hover:underline truncate"
            >
              {b.meeting_link}
            </a>
          </div>
        )}

        {/* Confirm / Decline actions */}
        {showActions && <BookingActions sessionId={b.id} />}
      </div>
    </div>
  )
}
