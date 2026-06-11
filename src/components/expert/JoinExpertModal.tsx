'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

export default function JoinExpertModal({ userName }: { userName: string }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const [fullName, setFullName] = useState(userName)
  const [fieldOfExpertise, setFieldOfExpertise] = useState('')
  const [skills, setSkills] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [hourlyRate, setHourlyRate] = useState('100')
  const [bio, setBio] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function close() {
    if (loading) return
    setOpen(false)
    setError('')
    setDone(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          fieldOfExpertise,
          skills,
          yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
          hourlyRate: parseInt(hourlyRate) || 100,
          bio,
          linkedinUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to submit application')
        return
      }

      setDone(true)
      setTimeout(() => {
        close()
        router.refresh()
      }, 2000)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-gray-300 dark:placeholder:text-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5'

  const modal = (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Join as Expert</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Share your expertise with SkillForge learners</p>
          </div>
          <button
            onClick={close}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {done ? (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-gray-900 dark:text-white">You&apos;re now an Expert!</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your profile is live and learners can book sessions with you.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl px-4 py-3 flex items-start gap-3">
                <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  Your profile will be instantly published. Learners can book sessions and pay with SCS coins.
                </p>
              </div>

              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Field of Expertise</label>
                <input type="text" required value={fieldOfExpertise} onChange={(e) => setFieldOfExpertise(e.target.value)} placeholder="e.g. Machine Learning, Full-Stack Development" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>
                  Skills <span className="text-gray-400 dark:text-gray-500 font-normal">(comma-separated)</span>
                </label>
                <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Python, TensorFlow, React, Node.js" className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Years of Experience</label>
                  <input type="number" min={0} max={50} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="e.g. 5" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>
                    Hourly Rate <span className="text-gray-400 dark:text-gray-500 font-normal">(SCS)</span>
                  </label>
                  <input type="number" min={50} max={10000} required value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="100" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Bio</label>
                <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Introduce yourself — your background, what you love teaching, your approach…" className={`${inputCls} resize-none`} />
              </div>

              <div>
                <label className={labelCls}>
                  LinkedIn / Portfolio URL <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                </label>
                <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" className={inputCls} />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-600 dark:text-red-400">
                  <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1 pb-1">
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !fullName.trim() || !fieldOfExpertise.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-linear-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting…
                    </>
                  ) : (
                    'Create Expert Profile'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Join as Expert
      </button>

      {mounted && open && createPortal(modal, document.body)}
    </>
  )
}
