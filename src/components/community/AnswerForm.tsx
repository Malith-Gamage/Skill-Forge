'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface AnswerAnalysis {
  score: number
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  feedback: string
  suggestions: string[]
}

const qualityStyle: Record<string, { wrap: string; badge: string; title: string; icon: 'check' | 'warn' | 'x' }> = {
  Excellent: { wrap: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', title: 'text-emerald-700', icon: 'check' },
  Good:      { wrap: 'bg-indigo-50 border-indigo-200',   badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',   title: 'text-indigo-700',  icon: 'check' },
  Fair:      { wrap: 'bg-amber-50 border-amber-200',     badge: 'bg-amber-100 text-amber-700 border-amber-200',     title: 'text-amber-700',   icon: 'warn'  },
  Poor:      { wrap: 'bg-red-50 border-red-200',         badge: 'bg-red-100 text-red-700 border-red-200',           title: 'text-red-700',     icon: 'x'     },
}

function QualityIcon({ type }: { type: 'check' | 'warn' | 'x' }) {
  const base = 'w-4 h-4'
  if (type === 'check')
    return (
      <svg className={`${base} text-emerald-600`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    )
  if (type === 'warn')
    return (
      <svg className={`${base} text-amber-600`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    )
  return (
    <svg className={`${base} text-red-600`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0L21.303 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

// ── Coin icon (shared) ──────────────────────────────────────────────
function CoinIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-4 h-4'} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
    </svg>
  )
}

// ── Fixed coin notification toast ───────────────────────────────────
function CoinToast({ delta, onDone }: { delta: number; onDone: () => void }) {
  const [exiting, setExiting] = useState(false)

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(onDone, 260)
  }, [onDone])

  useEffect(() => {
    const t = setTimeout(dismiss, 3200)
    return () => clearTimeout(t)
  }, [dismiss])

  const positive = delta > 0

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold cursor-pointer select-none ${
        exiting ? 'coin-toast-out' : 'coin-toast'
      } ${
        positive
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}
      onClick={dismiss}
    >
      <CoinIcon className={`w-5 h-5 ${positive ? 'text-emerald-500' : 'text-red-400'}`} />
      <span>
        {positive ? `+${delta} coins earned!` : `${Math.abs(delta)} coins deducted`}
      </span>
      {/* Thin progress bar that drains over 3.2 s */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
        <div
          className={`h-full ${positive ? 'bg-emerald-300' : 'bg-red-300'}`}
          style={{ animation: 'coin-toast-drain 3.2s linear forwards' }}
        />
      </div>
    </div>
  )
}

// ── Rejection banner (above textarea when answer is not posted) ──────
function RejectionBanner({
  analysis,
  onDismiss,
}: {
  analysis: AnswerAnalysis
  onDismiss: () => void
}) {
  const style = qualityStyle[analysis.quality] ?? qualityStyle.Fair
  const arrowColor = analysis.quality === 'Poor' ? 'text-red-400' : 'text-amber-500'

  return (
    <div className={`rounded-2xl border p-5 ${style.wrap}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            analysis.quality === 'Fair' ? 'bg-amber-100' : 'bg-red-100'
          }`}>
            <QualityIcon type={style.icon} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-bold ${style.title}`}>Answer Not Posted</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                {analysis.quality} · {analysis.score}/10
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest font-semibold">
              AI Quality Evaluation
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          aria-label="Dismiss feedback"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed">{analysis.feedback}</p>

      {analysis.suggestions?.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200/60">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            How to improve your answer
          </p>
          <ul className="space-y-1.5">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className={`font-bold shrink-0 mt-0.5 ${arrowColor}`}>→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">Edit your answer below and resubmit.</p>
    </div>
  )
}

// ── Success panel (replaces form after a correct answer is posted) ───
function SuccessPanel({ analysis }: { analysis: AnswerAnalysis }) {
  const style = qualityStyle[analysis.quality] ?? qualityStyle.Good

  return (
    <div className={`rounded-2xl border p-5 ${style.wrap}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <QualityIcon type="check" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold ${style.title}`}>
              {analysis.quality === 'Excellent' ? 'Excellent Answer!' : 'Good Answer!'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
              {analysis.quality} · {analysis.score}/10
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest font-semibold">
            AI Quality Evaluation
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{analysis.feedback}</p>
    </div>
  )
}

// ── Main form ────────────────────────────────────────────────────────
export function AnswerForm({ postId }: { postId: string }) {
  const router = useRouter()
  const [content, setContent]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [aiFeedback, setAiFeedback] = useState<AnswerAnalysis | null>(null)
  const [posted, setPosted]         = useState(false)
  const [coinDelta, setCoinDelta]   = useState<number | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError('')
    setAiFeedback(null)
    setCoinDelta(null)

    const res = await fetch(`/api/community/${postId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim() }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to post answer')
      return
    }

    // Show coin toast for any non-zero change
    if (data.coinDelta !== 0) setCoinDelta(data.coinDelta ?? null)

    // Always refresh so the Navbar coin balance updates
    router.refresh()

    if (data.posted) {
      setContent('')
      setPosted(true)
      setAiFeedback(data.analysis ?? null)
    } else {
      // Keep content so user can revise
      setAiFeedback(data.analysis ?? null)
    }
  }

  if (posted && aiFeedback) return <SuccessPanel analysis={aiFeedback} />
  if (posted) return null

  return (
    <>
      {/* Fixed coin toast — rendered outside the card so it sits at screen edge */}
      {coinDelta !== null && (
        <CoinToast delta={coinDelta} onDone={() => setCoinDelta(null)} />
      )}

      <form onSubmit={submit} className="space-y-4">
        {aiFeedback && (
          <RejectionBanner
            analysis={aiFeedback}
            onDismiss={() => setAiFeedback(null)}
          />
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your knowledge. Be specific and clear…"
          rows={5}
          disabled={loading}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-gray-300 disabled:opacity-60"
        />

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-linear-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing with AI…
            </span>
          ) : aiFeedback ? (
            'Resubmit Answer'
          ) : (
            'Post Answer'
          )}
        </button>
      </form>
    </>
  )
}

export function AcceptButton({
  postId, answerId, isOwner,
}: {
  postId: string; answerId: string; isOwner: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isOwner) return null

  async function accept() {
    setLoading(true)
    await fetch(`/api/community/${postId}/answers/${answerId}/accept`, { method: 'PATCH' })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={accept}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-60 shrink-0"
    >
      {loading ? (
        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )}
      Accept Answer
    </button>
  )
}
