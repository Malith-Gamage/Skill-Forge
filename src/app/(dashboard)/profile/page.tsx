'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

/* ── loading skeleton shown while AnalyticsSection chunk loads ── */
function AnalyticsFallback() {
  return (
    <div className="flex items-center justify-center py-16 gap-3">
      <svg className="animate-spin h-6 w-6 text-indigo-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className="text-sm text-gray-400">Loading analytics…</span>
    </div>
  )
}

const AnalyticsSection = dynamic(() => import('./AnalyticsSection'), {
  ssr: false,
  loading: AnalyticsFallback,
})

interface UserProfile {
  name: string
  email: string
  avatarUrl: string | null
  coinBalance: number
}

function compressImage(file: File, maxDimension = 600, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
        'image/jpeg',
        quality,
      )
    }
    img.onerror = reject
    img.src = url
  })
}

/* ── tiny fade-in helper ── */
function fadeStyle(visible: boolean, delayMs = 0): React.CSSProperties {
  return {
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateY(0)' : 'translateY(14px)',
    transition: `opacity 0.5s ease ${delayMs}ms, transform 0.5s ease ${delayMs}ms`,
  }
}

export default function ProfilePage() {
  const [profile,   setProfile]   = useState<UserProfile | null>(null)
  const [preview,   setPreview]   = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)
  const [entered,   setEntered]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setProfile({
            name:        data.user.name,
            email:       data.user.email,
            avatarUrl:   data.user.avatar_url ?? null,
            coinBalance: Number(data.user.coin_balance ?? 0),
          })
        }
      })
    const t = setTimeout(() => setEntered(true), 60)
    return () => clearTimeout(t)
  }, [])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setSuccess(false)

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, or WebP images are allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large (max 5 MB).')
      return
    }

    setUploading(true)
    setPreview(URL.createObjectURL(file))

    try {
      const compressed = await compressImage(file)
      const body = new FormData()
      body.append('avatar', compressed, 'avatar.jpg')

      const res  = await fetch('/api/profile/avatar', { method: 'PATCH', body })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Upload failed.')
        setPreview(null)
        return
      }

      setProfile((p) => (p ? { ...p, avatarUrl: data.avatarUrl } : p))
      setPreview(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Upload failed. Please try again.')
      setPreview(null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const displaySrc = preview ?? profile?.avatarUrl ?? null
  const initial    = profile?.name.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="max-w-5xl mx-auto pt-2 pb-12">

      {/* ── Page heading ── */}
      <div style={fadeStyle(entered, 0)} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account details and view your learning progress
        </p>
      </div>

      {/* ── Profile card (full width) ── */}
      <div style={fadeStyle(entered, 80)}>
        {!profile ? (
          /* skeleton */
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
            <div className="h-28 bg-linear-to-r from-gray-200 to-gray-300" />
            <div className="px-7 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-end gap-5 -mt-12">
                <div className="w-24 h-24 rounded-full bg-gray-300 ring-4 ring-white shrink-0" />
                <div className="space-y-2 pb-1 pt-14">
                  <div className="h-5 bg-gray-200 rounded w-36" />
                  <div className="h-4 bg-gray-200 rounded w-52" />
                  <div className="h-6 bg-gray-200 rounded-full w-24 mt-2" />
                </div>
              </div>
              <div className="space-y-2 sm:pb-1">
                <div className="h-9 bg-gray-200 rounded-xl w-32" />
                <div className="h-3 bg-gray-200 rounded w-44" />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

            {/* Gradient banner */}
            <div className="h-28 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-600 relative">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
            </div>

            {/* Card body — avatar left, upload controls right */}
            <div className="px-7 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

              {/* Left: avatar + name + email + coins */}
              <div className="flex items-end gap-5 -mt-12">
                <div
                  className="group relative shrink-0 cursor-pointer"
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  title="Change photo"
                >
                  {displaySrc ? (
                    <img
                      src={displaySrc}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-md select-none">
                      {initial}
                    </div>
                  )}

                  {!uploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-white text-[10px] mt-0.5 font-semibold">Edit</span>
                    </div>
                  )}

                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="pb-1 pt-14">
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">{profile.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
                  <span className="inline-flex items-center gap-1.5 mt-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-sm font-semibold">
                    🪙 {profile.coinBalance.toLocaleString()} coins
                  </span>
                </div>
              </div>

              {/* Right: upload controls */}
              <div className="flex flex-col gap-1.5 sm:pb-1.5">
                <button
                  type="button"
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-5 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                >
                  {uploading ? 'Uploading…' : 'Change photo'}
                </button>
                <span className="text-xs text-gray-400 text-center">JPEG, PNG or WebP · max 5 MB</span>
              </div>

            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Feedback messages */}
            {(error || success) && (
              <div className="px-7 pb-5">
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Profile picture updated successfully.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div style={fadeStyle(entered, 200)} className="my-8 flex items-center gap-4">
        <div className="flex-1 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
          <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Analytics</span>
        </div>
        <div className="flex-1 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      {/* ── Analytics ── */}
      <div style={fadeStyle(entered, 280)}>
        <AnalyticsSection />
      </div>

    </div>
  )
}
