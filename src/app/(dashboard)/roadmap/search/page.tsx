'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const suggestions = [
  'Python', 'React', 'Machine Learning', 'UI/UX Design',
  'Node.js', 'DevOps', 'Data Science', 'Flutter',
]

export default function RoadmapSearchPage() {
  const router = useRouter()
  const [skill, setSkill] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!skill.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: skill.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to generate roadmap')
        setLoading(false)
        return
      }

      router.push(`/roadmap/${data.id}`)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Generate a Roadmap</h1>
        <p className="text-gray-500 mt-1 text-sm">Tell us what you want to learn and AI will build a personalised roadmap.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="skill" className="block text-sm font-medium text-gray-700 mb-1.5">
              What skill do you want to learn?
            </label>
            <input
              id="skill"
              type="text"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="e.g. React, Python, Machine Learning..."
              disabled={loading}
              autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !skill.trim()}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AI is building your roadmap…
              </>
            ) : (
              'Generate Roadmap →'
            )}
          </button>
        </form>

        {!loading && (
          <div className="mt-5">
            <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Popular skills</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSkill(s)}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-5 p-4 bg-indigo-50 rounded-xl text-center">
            <p className="text-sm text-indigo-700 font-medium">Calling AI to generate your personalised roadmap…</p>
            <p className="text-xs text-indigo-400 mt-1">Usually takes 10–20 seconds</p>
          </div>
        )}
      </div>
    </div>
  )
}
