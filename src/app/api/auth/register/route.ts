import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/hash';
import { signJWT } from '@/lib/jwt';
import { registerSchema } from '@/lib/validators';
import { rateLimit, getClientIp } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`register:${ip}`, 3, 15 * 60 * 1000))
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { name, email, password } = parsed.data;

    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

    const password_hash = await hashPassword(password);
    const userId    = crypto.randomUUID();
    const profileId = crypto.randomUUID();

    await query(
      `INSERT INTO users (id, name, email, password_hash, role, email_verified)
       VALUES (?, ?, ?, ?, 'LEARNER', 0)`,
      [userId, name, email, password_hash],
    );
    await query('INSERT INTO profiles (id, user_id) VALUES (?, ?)', [profileId, userId]);

    const token = await signJWT({ userId, email, role: 'LEARNER' });
    const cookieStore = await cookies();
    cookieStore.set('skillforge_session', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      maxAge:   60 * 60 * 24 * 7,
      path:     '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ id: userId, name, email, role: 'LEARNER' }, { status: 201 });
  } catch (err: any) {
    console.error('[REGISTER]', err.message, err.code);
    if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return NextResponse.json({ error: 'Database connection failed. Please contact support.' }, { status: 503 });
    }
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({ error: 'Database not initialized. Run migrations first.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
