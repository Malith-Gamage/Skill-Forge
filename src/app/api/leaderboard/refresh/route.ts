import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await query(
    `INSERT INTO leaderboard (id, user_id, total_answers, coins_earned, badges_count, \`rank\`)
     SELECT
       UUID()                                        AS id,
       u.id                                          AS user_id,
       COUNT(DISTINCT ca.id)                         AS total_answers,
       COALESCE(p.total_coins_earned, 0)             AS coins_earned,
       COUNT(DISTINCT b.id)                          AS badges_count,
       RANK() OVER (
         ORDER BY COUNT(DISTINCT ca.id) DESC,
                  COALESCE(p.total_coins_earned, 0) DESC
       )                                             AS \`rank\`
     FROM users u
     LEFT JOIN community_answers ca ON ca.user_id = u.id AND ca.is_accepted = 1
     LEFT JOIN profiles p           ON p.user_id = u.id
     LEFT JOIN badges b             ON b.user_id = u.id
     GROUP BY u.id
     ON DUPLICATE KEY UPDATE
       total_answers = VALUES(total_answers),
       coins_earned  = VALUES(coins_earned),
       badges_count  = VALUES(badges_count),
       \`rank\`      = VALUES(\`rank\`),
       updated_at    = NOW(3)`,
  );

  return NextResponse.json({ success: true });
}
