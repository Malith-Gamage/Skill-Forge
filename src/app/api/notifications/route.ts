import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notifications = await query<any>(
    `SELECT id, message, type, is_read, reference_id, sent_at AS created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY sent_at DESC
     LIMIT 50`,
    [userId],
  );

  return NextResponse.json(notifications.map((n) => ({ ...n, is_read: !!n.is_read })));
}

export async function PATCH(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);

  return NextResponse.json({ success: true });
}
