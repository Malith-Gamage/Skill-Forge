'use client'

import { useState, useEffect, useCallback } from 'react'

interface Session {
  id: string
  skill_domain: string
  scheduled_date: string
  status: string
  coin_cost: number
  notes: string
  meeting_link: string | null
  created_at: string
  user_name: string
  user_email: string
  expert_name: string
  field_of_expertise: string
}

const statusBadge: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-600',
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING')
  const [actionId, setActionId] = useState<string | null>(null)
  const [meetingLink, setMeetingLink] = useState('')
  const [actionType, setActionType] = useState<'confirm' | 'reject' | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/sessions')
    if (res.ok) {
      const data = await res.json()
      setSessions(data.sessions ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openConfirm(id: string) {
    setActionId(id)
    setActionType('confirm')
    setMeetingLink('')
    setError('')
  }

  function openReject(id: string) {
    setActionId(id)
    setActionType('reject')
    setError('')
  }

  async function handleAction() {
    if (!actionId || !actionType) return
    setSaving(true)
    setError('')

    const body = actionType === 'confirm' ? { action: 'confirm', meetingLink } : { action: 'reject' }
    const res = await fetch(`/api/admin/sessions/${actionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setSaving(false); return }

    setActionId(null)
    setActionType(null)
    load()
    setSaving(false)
  }

  const displayed = filter === 'PENDING' ? sessions.filter(s => s.status === 'PENDING') : sessions

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Approvals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Confirm or reject expert session bookings</p>
        </div>
        <div className="flex gap-2">
          {(['PENDING', 'ALL'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === f ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {f === 'PENDING' ? 'Pending' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
          {filter === 'PENDING' ? 'No pending sessions.' : 'No sessions found.'}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{s.skill_domain}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-medium">{s.user_name}</span> ({s.user_email}) →{' '}
                    <span className="font-medium">{s.expert_name}</span> · {s.field_of_expertise}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${statusBadge[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {s.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 mb-3">
                <div>
                  <span className="font-medium text-gray-400 uppercase tracking-wide text-[10px]">Scheduled</span>
                  <p className="mt-0.5">{new Date(s.scheduled_date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-400 uppercase tracking-wide text-[10px]">Booked</span>
                  <p className="mt-0.5">{new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-400 uppercase tracking-wide text-[10px]">Cost</span>
                  <p className="mt-0.5 text-amber-600 font-medium">{s.coin_cost} SCS</p>
                </div>
              </div>

              {s.notes && (
                <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Notes</p>
                  <p className="text-xs text-gray-600">{s.notes}</p>
                </div>
              )}

              {s.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button onClick={() => openConfirm(s.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-green-700">
                    Confirm
                  </button>
                  <button onClick={() => openReject(s.id)}
                    className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-red-50">
                    Reject &amp; Refund
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {actionId && actionType && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            {actionType === 'confirm' ? (
              <>
                <h2 className="text-lg font-bold text-gray-900">Confirm Session</h2>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meeting Link *</label>
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={e => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900">Reject Session?</h2>
                <p className="text-sm text-gray-600">The session will be cancelled and the user will be refunded the full coin cost.</p>
              </>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => { setActionId(null); setActionType(null) }}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={saving || (actionType === 'confirm' && !meetingLink)}
                className={`flex-1 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 ${actionType === 'confirm' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {saving ? '…' : actionType === 'confirm' ? 'Confirm' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
