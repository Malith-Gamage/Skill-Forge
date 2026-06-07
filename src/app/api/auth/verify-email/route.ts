import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token)
    return NextResponse.json({ error: 'Token required' }, { status: 400 });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const [record] = await query<any>(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = ? AND used = 0 AND expires_at > NOW(3)`,
    [tokenHash],
  );
  if (!record)
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });

  await query('UPDATE users SET email_verified = 1 WHERE id = ?', [record.user_id]);
  await query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [record.id]);

  return NextResponse.json({ success: true });
}
