import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query(
    `SELECT l.user_id, l.\`rank\`, l.coins_earned, l.badges_count,
            l.total_answers AS answers_given,
            u.name AS user_name
     FROM leaderboard l
     JOIN users u ON u.id = l.user_id
     ORDER BY l.\`rank\` ASC
     LIMIT 50`,
  );

  return NextResponse.json(rows);
}
