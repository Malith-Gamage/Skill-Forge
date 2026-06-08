'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BookSessionPage({ params }: { params: Promise<{ expertId: string }> }) {
  const { expertId } = React.use(params)
  const router = useRouter()

  const [skillDomain, setSkillDomain] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isNetworkError, setIsNetworkError] = useState(false)

  async function submitBooking() {
    setError('')
    setIsNetworkError(false)
    setLoading(true)
    try {
      const res = await fetch('/api/expert/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expert_id: expertId,
          skill_domain: skillDomain || undefined,
          scheduled_date: new Date(scheduledDate).toISOString(),
          duration_minutes: 30,
          notes: notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to book session'); return }
      router.push('/expert/sessions')
    } catch {
      setError('Network error — please check your connection and try again.')
      setIsNetworkError(true)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submitBooking()
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().slice(0, 16)

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-300'
  const iconInputCls = 'w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-300'

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="dash-fade-up flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/expert/${expertId}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors font-medium mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to Expert
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Book a Session</h1>
          <p className="text-sm text-gray-500 mt-1">30-minute 1-on-1 with an industry expert</p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl mt-1">
          <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
          </svg>
          <span className="text-sm font-bold text-amber-600">−3,000 SCS</span>
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Form — 2/3 ── */}
        <div className="lg:col-span-2 dash-fade-up dash-d-2">

          {/* Cost notice */}
          <div className="flex items-start gap-3 bg-linear-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-4 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-900">3,000 SCS will be deducted on booking</p>
              <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
                Sessions are reviewed by admin. You&apos;ll receive a meeting link once confirmed.
              </p>
            </div>
          </div>

          {/* Form card */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 space-y-5">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Skill / Topic <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={skillDomain}
                    onChange={e => setSkillDomain(e.target.value)}
                    placeholder="e.g. React performance, System design, Docker"
                    required
                    maxLength={100}
                    className={iconInputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Preferred date &amp; time <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </div>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    required
                    min={minDateStr}
                    className={iconInputCls}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Must be at least 24 hours from now</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Notes{' '}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="What specific questions do you have? What should the expert prepare?"
                  rows={6}
                  maxLength={500}
                  className={`${inputCls} resize-none`}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{notes.length}/500</p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p>{error}</p>
                    {isNetworkError && (
                      <button
                        type="button"
                        onClick={submitBooking}
                        disabled={loading}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 underline underline-offset-2 disabled:opacity-50"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Booking…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Confirm Booking · 3,000 SCS
                  </>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                Coins are deducted immediately after booking
              </p>
            </div>
          </form>
        </div>

        {/* ── Sidebar — 1/3 ── */}
        <div className="space-y-4">

          {/* Session details */}
          <div className="dash-fade-up dash-d-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Session Details</h3>
            <div className="space-y-3">
              {[
                {
                  icon: (
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  ),
                  label: 'Duration', value: '30 minutes',
                },
                {
                  icon: (
                    <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  ),
                  label: 'Format', value: 'Zoom Meeting',
                },
                {
                  icon: (
                    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
                    </svg>
                  ),
                  label: 'Cost', value: '3,000 SCS coins',
                },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What happens next */}
          <div className="dash-fade-up dash-d-4 bg-linear-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-5">
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
              </svg>
              What happens next
            </h3>
            <div className="space-y-3">
              {[
                { step: '1', label: 'Booking submitted', desc: '3,000 SCS deducted from your balance' },
                { step: '2', label: 'Admin reviews', desc: 'Confirmed within 24 hours' },
                { step: '3', label: 'Meeting link sent', desc: 'Join at your scheduled time' },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-extrabold text-indigo-600 shrink-0 mt-0.5">
                    {step}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prep tips */}
          <div className="dash-fade-up dash-d-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">How to prepare</h3>
            <ul className="space-y-2.5">
              {[
                'Write down your questions before the session',
                'Share code or examples in your notes if relevant',
                'Be on time — sessions are fixed 30 minutes',
                'Have a stable internet connection ready',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                  <span className="text-indigo-400 font-bold shrink-0 mt-0.5">→</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  )
}
