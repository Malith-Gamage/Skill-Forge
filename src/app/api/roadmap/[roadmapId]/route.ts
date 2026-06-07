import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roadmapId: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roadmapId } = await params;

  const [roadmap] = await query<any>(
    `SELECT * FROM roadmaps WHERE id = ? AND user_id = ? AND status != 'REMOVED'`,
    [roadmapId, userId],
  );

  if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const checkpoints = await query(
    `SELECT c.id, c.roadmap_id, c.title, c.order_index, c.status,
            c.coins_awarded AS coin_reward, c.created_at
     FROM checkpoints c
     WHERE c.roadmap_id = ? ORDER BY c.order_index`,
    [roadmapId],
  );

  return NextResponse.json({ ...roadmap, checkpoints });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roadmapId: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roadmapId } = await params;

  await query(
    `UPDATE roadmaps SET status = 'REMOVED' WHERE id = ? AND user_id = ?`,
    [roadmapId, userId],
  );

  return NextResponse.json({ success: true });
}
