import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query(
    `SELECT
       u.id                                                                          AS user_id,
       u.name                                                                        AS user_name,
       p.total_coins_earned                                                          AS coins_earned,
       RANK() OVER (ORDER BY p.total_coins_earned DESC, u.name ASC)                 AS \`rank\`,
       COALESCE(qst.questions_posted, 0)                                             AS questions_posted,
       COALESCE(bdg.badges_count,    0)                                             AS badges_count
     FROM users u
     JOIN profiles p ON p.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS questions_posted
       FROM community_posts
       GROUP BY user_id
     ) qst ON qst.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS badges_count
       FROM badges GROUP BY user_id
     ) bdg ON bdg.user_id = u.id
     ORDER BY p.total_coins_earned DESC, u.name ASC
     LIMIT 50`,
  );

  return NextResponse.json(rows);
}
