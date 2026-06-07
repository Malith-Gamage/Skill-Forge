'use client'

import { useEffect, useRef, useState } from 'react'

interface UserProfile {
  name: string
  email: string
  avatarUrl: string | null
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
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Compression failed')), 'image/jpeg', quality)
    }
    img.onerror = reject
    img.src = url
  })
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setProfile({
            name: data.user.name,
            email: data.user.email,
            avatarUrl: data.user.avatar_url ?? null,
          })
        }
      })
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

      const res = await fetch('/api/profile/avatar', { method: 'PATCH', body })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Upload failed.')
        setPreview(null)
        return
      }

      setProfile((p) => p ? { ...p, avatarUrl: data.avatarUrl } : p)
      setPreview(null)
      setSuccess(true)
    } catch {
      setError('Upload failed. Please try again.')
      setPreview(null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const displaySrc = preview ?? profile?.avatarUrl ?? null
  const initial = profile?.name.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Profile Picture</h2>

        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {displaySrc ? (
              <img
                src={displaySrc}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold select-none">
                {initial}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => !uploading && fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading…' : 'Choose photo'}
            </button>
            <p className="text-xs text-gray-500">JPEG, PNG or WebP · max 5 MB</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-600">Profile picture updated.</p>}
      </div>

      {profile && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-4">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Account Info</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-gray-500 w-16">Name</dt>
              <dd className="text-gray-900 font-medium">{profile.name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-16">Email</dt>
              <dd className="text-gray-900">{profile.email}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
