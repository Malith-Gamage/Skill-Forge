import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { awardCoins } from '@/lib/coins';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await params;
  const body = await req.json();
  const { action, meetingLink } = body as { action: string; meetingLink?: string };

  if (action !== 'confirm' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be confirm or reject' }, { status: 400 });
  }

  // Verify the calling user is the expert for this session
  const [mapping] = await query<{ expert_id: string }>(
    `SELECT expert_id FROM user_expert_map WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  if (!mapping) {
    return NextResponse.json({ error: 'You are not registered as an expert' }, { status: 403 });
  }

  const [session] = await query<{
    id: string; user_id: string; expert_id: string; status: string;
    skill_domain: string | null; scheduled_date: string; coin_cost: number;
  }>(
    `SELECT id, user_id, expert_id, status, skill_domain, scheduled_date, coin_cost
     FROM expert_sessions WHERE id = ? AND expert_id = ?`,
    [sessionId, mapping.expert_id],
  );

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (session.status !== 'PENDING') {
    return NextResponse.json({ error: 'Session is no longer pending' }, { status: 409 });
  }

  const [expertRow] = await query<{ name: string }>(
    `SELECT name FROM industry_experts WHERE id = ?`,
    [mapping.expert_id],
  );
  const expertName = expertRow?.name ?? 'the expert';

  const dateStr = new Date(session.scheduled_date).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const topic = session.skill_domain ?? 'General session';

  if (action === 'confirm') {
    await query(
      `UPDATE expert_sessions SET status = 'CONFIRMED', meeting_link = ? WHERE id = ?`,
      [meetingLink?.trim() || null, sessionId],
    );
    await query(
      `INSERT INTO notifications (id, user_id, message, type, reference_id)
       VALUES (?, ?, ?, 'SESSION_CONFIRMED', ?)`,
      [
        crypto.randomUUID(),
        session.user_id,
        `Your booking with ${expertName} has been confirmed! Topic: "${topic}" on ${dateStr}.`,
        sessionId,
      ],
    );
  } else {
    await query(
      `UPDATE expert_sessions SET status = 'CANCELLED' WHERE id = ?`,
      [sessionId],
    );
    try {
      await awardCoins(
        session.user_id,
        session.coin_cost,
        'REFUND',
        `Refund: session with ${expertName} was declined`,
        sessionId,
      );
    } catch {
      // Non-critical
    }
    await query(
      `INSERT INTO notifications (id, user_id, message, type, reference_id)
       VALUES (?, ?, ?, 'SESSION_REJECTED', ?)`,
      [
        crypto.randomUUID(),
        session.user_id,
        `Your booking with ${expertName} was declined. ${session.coin_cost.toLocaleString()} SCS has been refunded to your account.`,
        sessionId,
      ],
    );
  }

  // Mark the expert's SESSION_BOOKING notification as read
  await query(
    `UPDATE notifications SET is_read = 1
     WHERE user_id = ? AND reference_id = ? AND type = 'SESSION_BOOKING'`,
    [userId, sessionId],
  );

  return NextResponse.json({ success: true });
}
