import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { query } from '@/lib/db'
import { signJWT } from '@/lib/jwt'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

function redirectError(code: string) {
  return NextResponse.redirect(`${APP_URL}/register?error=${code}`)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (searchParams.get('error')) return redirectError('google_cancelled')

  const cookieStore = await cookies()
  const savedState = cookieStore.get('oauth_state')?.value
  cookieStore.set('oauth_state', '', { maxAge: 0, path: '/' })

  if (!code || !state || state !== savedState) return redirectError('invalid_state')

  // Exchange authorization code for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${APP_URL}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) return redirectError('token_exchange')
  const { access_token } = await tokenRes.json()

  // Fetch Google profile
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!profileRes.ok) return redirectError('userinfo')
  const googleUser = await profileRes.json()

  const email: string | undefined = googleUser.email
  const name: string = googleUser.name ?? email?.split('@')[0] ?? 'User'

  if (!email) return redirectError('no_email')

  // Find existing user or create one
  const rows = await query<{ id: string; role: string }>('SELECT id, role FROM users WHERE email = ?', [email])

  let userId: string
  let role: string

  if (rows.length > 0) {
    userId = rows[0].id
    role = rows[0].role
  } else {
    userId = crypto.randomUUID()
    const profileId = crypto.randomUUID()
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, email_verified)
       VALUES (?, ?, ?, '', 'LEARNER', 1)`,
      [userId, name, email],
    )
    await query('INSERT INTO profiles (id, user_id) VALUES (?, ?)', [profileId, userId])
    role = 'LEARNER'
  }

  const token = await signJWT({ userId, email, role })
  cookieStore.set('skillforge_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  })

  return NextResponse.redirect(`${APP_URL}/dashboard`)
}
