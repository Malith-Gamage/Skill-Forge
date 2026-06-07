import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId } = await params;

  const [post] = await query<any>(
    `SELECT p.*, u.name AS author_name
     FROM community_posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.id = ?`,
    [postId],
  );
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const answers = await query(
    `SELECT a.*, u.name AS author_name
     FROM community_answers a
     JOIN users u ON u.id = a.user_id
     WHERE a.post_id = ?
     ORDER BY a.is_accepted DESC, a.created_at ASC`,
    [postId],
  );

  return NextResponse.json({ ...post, answers });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId } = await params;

  await query(
    'DELETE FROM community_posts WHERE id = ? AND user_id = ?',
    [postId, userId],
  );

  return NextResponse.json({ success: true });
}
