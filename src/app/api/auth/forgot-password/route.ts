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

      // Use DATE_ADD(NOW(3), ...) so expiry is computed by MySQL itself —
      // avoids JS Date → mysql2 timezone conversion bugs on non-UTC hosts.
      await query(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
         VALUES (?, ?, ?, DATE_ADD(NOW(3), INTERVAL 15 MINUTE))`,
        [tokenId, user.id, tokenHash],
      );

      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/reset-password?token=${rawToken}`;
      try {
        await sendPasswordResetEmail(email, rawToken);
      } catch (emailErr: any) {
        // Email service not configured — log link so it's usable during development
        console.warn('[FORGOT-PASSWORD] Email send failed:', emailErr.message);
        console.info('[FORGOT-PASSWORD] Reset link (dev fallback):', resetLink);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[FORGOT-PASSWORD]', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
