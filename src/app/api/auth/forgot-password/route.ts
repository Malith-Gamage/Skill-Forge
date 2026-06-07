import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/mail';
import { forgotPasswordSchema } from '@/lib/validators';
import { rateLimit, getClientIp } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`forgot:${ip}`, 3, 15 * 60 * 1000))
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const { email } = parsed.data;
    const [user] = await query<any>('SELECT id FROM users WHERE email = ?', [email]);

    if (user) {
      const rawToken  = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const tokenId   = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await query(
        'INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
        [tokenId, user.id, tokenHash, expiresAt],
      );

      await sendPasswordResetEmail(email, rawToken);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[FORGOT-PASSWORD]', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
