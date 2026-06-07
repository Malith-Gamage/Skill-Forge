import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { awardCoins } from '@/lib/coins';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = req.headers.get('x-user-role');
  if (role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { action, meetingLink } = await req.json();

  const [session] = await query<any>(
    'SELECT * FROM expert_sessions WHERE id = ?',
    [id],
  );
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  if (session.status !== 'PENDING')
    return NextResponse.json({ error: 'Session is no longer pending' }, { status: 409 });

  if (action === 'confirm') {
    if (!meetingLink) return NextResponse.json({ error: 'Meeting link is required' }, { status: 400 });
    await query(
      `UPDATE expert_sessions SET status = 'CONFIRMED', meeting_link = ? WHERE id = ?`,
      [meetingLink, id],
    );
    return NextResponse.json({ success: true });
  }

  if (action === 'reject') {
    await query(
      `UPDATE expert_sessions SET status = 'CANCELLED' WHERE id = ?`,
      [id],
    );
    // Refund the full coin cost to the user
    await awardCoins(
      session.user_id,
      session.coin_cost,
      'SESSION_REFUND',
      'Expert session rejected — refund',
      id,
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
