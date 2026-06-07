import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string; answerId: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId, answerId } = await params;

  const [post] = await query<any>(
    'SELECT id FROM community_posts WHERE id = ? AND user_id = ?',
    [postId, userId],
  );
  if (!post) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await query('UPDATE community_answers SET is_accepted = 0 WHERE post_id = ?', [postId]);
  await query('UPDATE community_answers SET is_accepted = 1 WHERE id = ? AND post_id = ?', [
    answerId,
    postId,
  ]);
  await query(
    `UPDATE community_posts SET status = 'ANSWERED' WHERE id = ?`,
    [postId],
  );

  return NextResponse.json({ success: true });
}
