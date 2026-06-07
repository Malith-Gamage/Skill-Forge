import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { comparePassword } from '@/lib/hash';
import { signJWT } from '@/lib/jwt';
import { loginSchema } from '@/lib/validators';
import { rateLimit, getClientIp } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000))
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { email, password } = parsed.data;

    const [user] = await query<any>('SELECT * FROM users WHERE email = ?', [email]);
    if (!user)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    if (user.role === 'SUSPENDED')
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });

    const valid = await comparePassword(password, user.password_hash);
    if (!valid)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    const token = await signJWT({ userId: user.id, email: user.email, role: user.role });
    const cookieStore = await cookies();
    cookieStore.set('skillforge_session', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      maxAge:   60 * 60 * 24 * 7,
      path:     '/',
      sameSite: 'lax',
    });

    return NextResponse.json({
      id:            user.id,
      name:          user.name,
      email:         user.email,
      role:          user.role,
      emailVerified: !!user.email_verified,
    });
  } catch (err: any) {
    console.error('[LOGIN]', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
