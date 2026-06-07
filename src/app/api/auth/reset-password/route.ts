import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/hash';
import { resetPasswordSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const { token, newPassword } = parsed.data;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [record] = await query<any>(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = ? AND used = 0 AND expires_at > NOW(3)`,
      [tokenHash],
    );
    if (!record)
      return NextResponse.json({ error: 'Token is invalid or expired' }, { status: 400 });

    const password_hash = await hashPassword(newPassword);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, record.user_id]);
    await query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [record.id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[RESET-PASSWORD]', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
