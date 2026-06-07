'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const suggestions = [
  { label: 'Python',           color: 'bg-blue-50   text-blue-700   border-blue-200   hover:bg-blue-100   hover:border-blue-300'   },
  { label: 'React',            color: 'bg-cyan-50   text-cyan-700   border-cyan-200   hover:bg-cyan-100   hover:border-cyan-300'   },
  { label: 'Machine Learning', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300' },
  { label: 'UI/UX Design',     color: 'bg-pink-50   text-pink-700   border-pink-200   hover:bg-pink-100   hover:border-pink-300'   },
  { label: 'Node.js',          color: 'bg-green-50  text-green-700  border-green-200  hover:bg-green-100  hover:border-green-300'  },
  { label: 'DevOps',           color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300' },
  { label: 'Data Science',     color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300' },
  { label: 'Flutter',          color: 'bg-teal-50   text-teal-700   border-teal-200   hover:bg-teal-100   hover:border-teal-300'   },
]

const loadingSteps = [
  'Analyzing skill requirements',
  'Building your learning roadmap',
  'Creating checkpoints & tasks',
  'Curating the best resources',
]

const features = [
  {
    title: 'Structured Path',
    desc: 'Step-by-step checkpoints that guide you from beginner to advanced.',
    icon: (
      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
      </svg>
    ),
    bg: 'bg-indigo-50',
  },
  {
    title: 'Daily Tasks',
    desc: 'Bite-sized actionable tasks that earn you coins as you progress.',
    icon: (
      <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    bg: 'bg-violet-50',
  },
  {
    title: 'Curated Resources',
    desc: 'Hand-picked videos, courses and articles for every checkpoint.',
    icon: (
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
      </svg>
    ),
    bg: 'bg-blue-50',
  },
]

const successTips = [
  {
    icon: (
      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    title: 'Show up daily',
    desc: 'Even 20 minutes a day compounds into mastery faster than you think.',
  },
  {
    icon: (
      <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25" />
      </svg>
    ),
    title: 'Follow the order',
    desc: 'Each checkpoint builds on the last — skipping ahead slows you down.',
  },
  {
    icon: (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
      </svg>
    ),
    title: 'Use the resources',
    desc: 'Hand-picked videos and articles cut your learning time in half.',
  },
  {
    icon: (
      <svg className="w-4 h-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9.555 7.168A1 1 0 0 0 8 8v4a1 1 0 0 0 1.555.832l3-2a1 1 0 0 0 0-1.664l-3-2Z" clipRule="evenodd" />
      </svg>
    ),
    title: 'Collect your coins',
    desc: 'Every completed task earns rewards — let the streak keep you going.',
  },
]

export default function RoadmapSearchPage() {
  const router = useRouter()
  const [skill, setSkill]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [activeStep, setActiveStep] = useState(-1)
  const [focused, setFocused]       = useState(false)

  useEffect(() => {
    if (!loading) { setActiveStep(-1); return }
    setActiveStep(0)
    const timers = [
      setTimeout(() => setActiveStep(1), 2500),
      setTimeout(() => setActiveStep(2), 6000),
      setTimeout(() => setActiveStep(3), 11000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [loading])

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
      if (!res.ok) { setError(data.error ?? 'Failed to generate roadmap'); setLoading(false); return }
      router.push(`/roadmap/${data.id}`)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  /* ── Loading view (full-width centred) ─────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 w-full max-w-md text-center roadmap-fade-up">
          {/* Animated icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-25" />
            <div className="absolute inset-1.5 rounded-full bg-indigo-50 animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-9 h-9 text-white rm-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
              </svg>
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-1">Building your roadmap</h2>
          <p className="text-sm text-gray-500 mb-8">
            AI is crafting a personalised path for{' '}
            <span className="font-semibold text-indigo-600">{skill}</span>
          </p>

          <div className="space-y-3 text-left mb-8">
            {loadingSteps.map((step, i) => (
              <div
                key={step}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  i <= activeStep ? 'opacity-100' : 'opacity-20'
                } ${i === activeStep ? 'rm-step-in' : ''}`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  i < activeStep   ? 'bg-green-500'  :
                  i === activeStep ? 'bg-indigo-600' :
                  'bg-gray-200'
                }`}>
                  {i < activeStep ? (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : i === activeStep ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  )}
                </div>
                <span className={`text-sm transition-all duration-300 ${
                  i < activeStep   ? 'text-green-600 font-medium line-through decoration-green-300' :
                  i === activeStep ? 'text-gray-900 font-semibold' :
                  'text-gray-400'
                }`}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Usually takes 10–20 seconds
          </div>
        </div>
      </div>
    )
  }

  /* ── Main view (two-column) ─────────────────────────────────────── */
  return (
    <div className="h-full flex flex-col">

      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors mb-6 group roadmap-fade-up w-fit"
      >
        <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to dashboard
      </Link>

      {/* Two-column grid */}
      <div className="flex-1 grid grid-cols-5 gap-8 items-start">

        {/* ── Left column (form + hero) ─────────────────────────── */}
        <div className="col-span-3 space-y-6">

          {/* Hero text */}
          <div className="roadmap-fade-up rm-d-1">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-4">
              <svg className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-semibold text-indigo-600 tracking-wide">AI-Powered Learning</span>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 leading-tight tracking-tight">
              Generate Your
              <span className="block bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Learning Roadmap
              </span>
            </h1>
            <p className="text-gray-500 mt-3 text-sm leading-relaxed max-w-lg">
              Tell us what skill you want to master and our AI will build a personalised roadmap with checkpoints, tasks, and curated resources — ready in seconds.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 roadmap-fade-up rm-d-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="skill" className="block text-sm font-semibold text-gray-700 mb-2">
                  What skill do you want to learn?
                </label>
                <div className={`relative transition-transform duration-200 ${focused ? 'scale-[1.005]' : ''}`}>
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                    <svg className={`w-4 h-4 transition-colors duration-200 ${focused ? 'text-indigo-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </div>
                  <input
                    id="skill"
                    type="text"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="e.g. React, Python, Machine Learning..."
                    autoFocus
                    className={`w-full pl-10 pr-4 py-3.5 text-sm rounded-xl border-2 bg-gray-50 focus:bg-white transition-all duration-200 focus:outline-none ${
                      focused
                        ? 'border-indigo-400 shadow-[0_0_0_4px_rgba(99,102,241,0.10)]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 roadmap-fade-up">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!skill.trim()}
                className="w-full relative overflow-hidden bg-linear-to-r from-indigo-600 to-violet-600 text-white py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 group"
              >
                <span className="relative flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
                  </svg>
                  Generate Roadmap
                </span>
              </button>
            </form>

            {/* Skill suggestions */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Popular skills</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setSkill(s.label)}
                    style={{ animationDelay: `${0.28 + i * 0.04}s` }}
                    className={`roadmap-fade-up px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 ${s.color}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column (features + preview) ────────────────── */}
        <div className="col-span-2 space-y-4 roadmap-slide-left rm-d-2">

          {/* Feature cards */}
          {features.map((f, i) => (
            <div
              key={f.title}
              style={{ animationDelay: `${0.18 + i * 0.09}s` }}
              className="roadmap-fade-up bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}

          {/* Success / motivation card */}
          <div
            className="roadmap-fade-up relative overflow-hidden rounded-2xl border border-indigo-100 shadow-sm"
            style={{ animationDelay: '0.45s' }}
          >
            {/* Header gradient */}
            <div className="relative bg-linear-to-br from-indigo-600 to-violet-600 px-5 pt-5 pb-8">
              {/* Sparkle decorations */}
              <div className="absolute top-3 right-6 w-1.5 h-1.5 rounded-full bg-white/30 sparkle-dot"   />
              <div className="absolute top-7 right-12 w-1 h-1 rounded-full bg-white/20 sparkle-dot-2" />
              <div className="absolute bottom-4 left-8 w-1 h-1 rounded-full bg-white/20 sparkle-dot-3" />

              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 mb-3">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-white leading-snug">
                How to complete your roadmap successfully
              </h3>
              <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                Learners who follow these habits finish 4× faster.
              </p>
            </div>

            {/* Tips list */}
            <div className="bg-white -mt-4 rounded-t-2xl px-5 pt-5 pb-5 space-y-4">
              {successTips.map((tip, i) => (
                <div
                  key={tip.title}
                  style={{ animationDelay: `${0.50 + i * 0.08}s` }}
                  className="roadmap-fade-up flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    {tip.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{tip.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}

              {/* Motivational quote */}
              <div className="mt-2 pt-4 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 italic leading-relaxed text-center">
                  &ldquo;The expert in anything was once a beginner who simply refused to quit.&rdquo;
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
