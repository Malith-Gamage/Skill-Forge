import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  if (role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const users = await query<any>(
    `SELECT u.id, u.name, u.email, u.role, u.email_verified, u.created_at,
            p.coin_balance, p.learning_streak
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     ORDER BY u.created_at DESC
     LIMIT 100`,
  );

  return NextResponse.json(
    users.map((u) => ({ ...u, email_verified: !!u.email_verified })),
  );
}
