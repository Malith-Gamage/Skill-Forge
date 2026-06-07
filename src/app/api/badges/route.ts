import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const badges = await query<any>(
    `SELECT b.id, b.badge_type, b.is_golden, b.shareable_slug, b.awarded_at,
            c.title AS checkpoint_title
     FROM badges b
     LEFT JOIN checkpoints c ON c.id = b.checkpoint_id
     WHERE b.user_id = ?
     ORDER BY b.awarded_at DESC`,
    [userId],
  );

  return NextResponse.json(badges.map((b) => ({ ...b, is_golden: !!b.is_golden })));
}
