'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { z } from 'zod'

const formSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password too long'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FieldErrors = Partial<Record<'name' | 'email' | 'password' | 'confirmPassword', string>>

interface StrengthResult {
  score: number
  label: string
  barColor: string
  textColor: string
  checks: { length: boolean; upper: boolean; number: boolean; special: boolean }
}

function getStrength(pw: string): StrengthResult {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }
  const score = Object.values(checks).filter(Boolean).length
  if (score <= 1) return { score, label: 'Weak', barColor: 'bg-red-500', textColor: 'text-red-500', checks }
  if (score === 2) return { score, label: 'Medium', barColor: 'bg-yellow-500', textColor: 'text-yellow-600', checks }
  if (score === 3) return { score, label: 'Fair', barColor: 'bg-blue-400', textColor: 'text-blue-500', checks }
  return { score, label: 'Strong', barColor: 'bg-green-500', textColor: 'text-green-600', checks }
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_cancelled: 'Google sign-in was cancelled.',
  invalid_state: 'OAuth state mismatch — please try again.',
  token_exchange: 'Could not complete Google sign-in. Please try again.',
  userinfo: 'Could not retrieve your Google profile. Please try again.',
  no_email: 'Your Google account does not have an accessible email address.',
}

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [rateLimitMinutes, setRateLimitMinutes] = useState<number | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err) setFormError(OAUTH_ERROR_MESSAGES[err] ?? 'Google sign-in failed. Please try again.')
  }, [])

  const strength = password ? getStrength(password) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setFieldErrors({})
    setRateLimitMinutes(null)

    const parsed = formSchema.safeParse({ name, email, password, confirmPassword })
    if (!parsed.success) {
      const errors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FieldErrors
        if (field && !errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    setLoading(false)

    if (res.status === 429) {
      setRateLimitMinutes(15)
      return
    }
    if (!res.ok) {
      setFormError(data.error ?? 'Registration failed')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  function handleGoogleSignIn() {
    setGoogleLoading(true)
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900">SkillForge</span>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-gray-500 text-sm mb-6">Start your learning journey today</p>

          {/* Rate-limit banner */}
          {rateLimitMinutes && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              Too many attempts. Try again in {rateLimitMinutes} minutes.
            </div>
          )}

          {/* Generic error banner */}
          {formError && !rateLimitMinutes && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {formError}
            </div>
          )}

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Registration form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kasun Perera"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                  fieldErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                  fieldErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                    fieldErrors.password ? 'border-red-400 bg-red-50' : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}

              {/* Strength bar */}
              {strength && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strength.score ? strength.barColor : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strength.textColor}`}>{strength.label}</p>
                </div>
              )}

              {/* Requirements checklist */}
              {password && strength && (
                <ul className="mt-2 space-y-1">
                  {(
                    [
                      { label: 'At least 8 characters', ok: strength.checks.length },
                      { label: 'One uppercase letter', ok: strength.checks.upper },
                      { label: 'One number', ok: strength.checks.number },
                      { label: 'One special character (!@#$…)', ok: strength.checks.special },
                    ] as { label: string; ok: boolean }[]
                  ).map(({ label, ok }) => (
                    <li
                      key={label}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        ok ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {ok ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                    fieldErrors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">
            By signing up you agree to our{' '}
            <span className="underline cursor-pointer hover:text-gray-600">Terms of Service</span> and{' '}
            <span className="underline cursor-pointer hover:text-gray-600">Privacy Policy</span>.
          </p>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

