import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user] = await query<any>(
    `SELECT u.id, u.name, u.email, u.role, u.email_verified, u.created_at,
            p.coin_balance, p.learning_streak, p.total_coins_earned, p.avatar_url, p.bio
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?`,
    [userId],
  );

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ user: { ...user, email_verified: !!user.email_verified } });
}
