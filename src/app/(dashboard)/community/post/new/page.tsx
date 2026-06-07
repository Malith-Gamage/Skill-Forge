'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle]             = useState('')
  const [content, setContent]         = useState('')
  const [skillDomain, setSkillDomain] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, skill_domain: skillDomain }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to post question')
      return
    }

    router.push(`/community/post/${data.id}`)
  }

  const canSubmit = title.trim() && content.trim() && skillDomain.trim() && !loading

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="dash-fade-up flex items-start justify-between gap-4">
        <div>
          <Link
            href="/community/feed"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors font-medium mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to Feed
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Ask a Question</h1>
          <p className="text-sm text-gray-500 mt-1">Share your challenge with the SkillForge community</p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl mt-1">
          <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
          </svg>
          <span className="text-sm font-bold text-amber-600">−100 SCS</span>
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Form — 2/3 */}
        <div className="lg:col-span-2 dash-fade-up dash-d-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Question title
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's your question? Be specific and clear."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-gray-300"
              />
            </div>

            <div>
              <label htmlFor="skillDomain" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Skill / Topic
              </label>
              <input
                id="skillDomain"
                type="text"
                required
                value={skillDomain}
                onChange={(e) => setSkillDomain(e.target.value)}
                placeholder="e.g. Python, React, Machine Learning"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-gray-300"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Details
              </label>
              <textarea
                id="content"
                required
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your question in detail. Include what you've already tried and any error messages."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-gray-300"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-linear-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Posting…
                </span>
              ) : (
                'Post Question (−100 SCS)'
              )}
            </button>
            <p className="text-center text-xs text-gray-400 -mt-1">
              Coins are deducted from your balance after posting
            </p>
          </form>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-4">

          {/* Tips card */}
          <div className="dash-fade-up dash-d-3 bg-linear-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-5">
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
              </svg>
              Tips for a great question
            </h3>
            <ul className="space-y-2.5">
              {[
                'Be specific — vague questions get fewer answers',
                'Include code snippets or error messages if relevant',
                "Describe what you've already tried",
                'Pick the right skill tag so experts can find your question',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                  <span className="text-indigo-400 font-bold shrink-0 mt-0.5">→</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* How it works card */}
          <div className="dash-fade-up dash-d-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">How it works</h3>
            <div className="space-y-3">
              {[
                { step: '1', label: 'Post your question', desc: '100 SCS coins are deducted' },
                { step: '2', label: 'Community answers', desc: 'Learners share their knowledge' },
                { step: '3', label: 'Accept best answer', desc: 'Coins are rewarded to the helper' },
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

          {/* Coin info card */}
          <div className="dash-fade-up dash-d-5 bg-amber-50 rounded-2xl border border-amber-100 p-5">
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Coin rewards</h3>
            <div className="space-y-2">
              {[
                { label: 'Posting a question', value: '−100 SCS' },
                { label: 'Answer gets accepted', value: '+50–500' },
                { label: 'AI quality bonus', value: '+up to 50%' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className="text-amber-700/80">{label}</span>
                  <span className="font-bold text-amber-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
