import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { deductCoins } from '@/lib/coins';
import { bookSessionSchema } from '@/lib/validators';
import { sendBookingNotificationEmail } from '@/lib/mail';

async function notifyExpertOfBooking(
  expertId: string,
  bookerUserId: string,
  sessionId: string,
  skillDomain: string | null | undefined,
  scheduledDate: string,
  durationMinutes: number,
  notes: string | null | undefined,
) {
  try {
    const [[expertRow], [userRow], [expertMapping]] = await Promise.all([
      query<{ name: string; email: string }>(`SELECT name, email FROM industry_experts WHERE id = ?`, [expertId]),
      query<{ name: string; email: string }>(`SELECT name, email FROM users WHERE id = ?`, [bookerUserId]),
      query<{ user_id: string }>(`SELECT user_id FROM user_expert_map WHERE expert_id = ?`, [expertId]),
    ]);
    if (!expertRow || !userRow) return;

    const dateStr = new Date(scheduledDate).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    // In-app notification (only if the expert has a linked user account)
    if (expertMapping) {
      await query(
        `INSERT INTO notifications (id, user_id, message, type, reference_id)
         VALUES (?, ?, ?, 'SESSION_BOOKING', ?)`,
        [
          crypto.randomUUID(),
          expertMapping.user_id,
          `New booking from ${userRow.name}: "${skillDomain ?? 'General session'}" on ${dateStr}`,
          sessionId,
        ],
      );
    }

    // Email notification to the expert
    await sendBookingNotificationEmail({
      expertEmail:     expertRow.email,
      expertName:      expertRow.name,
      userName:        userRow.name,
      userEmail:       userRow.email,
      scheduledDate,
      durationMinutes,
      skillDomain,
      notes,
      sessionId,
    });
  } catch (err: any) {
    // Non-critical — session already created
    console.warn('[BOOKING-NOTIFY] Failed to send expert notification:', err.message);
  }
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessions = await query(
    `SELECT s.id, s.scheduled_date, s.duration_minutes, s.status,
            s.coin_cost, s.meeting_link, s.notes,
            e.name AS expert_name, e.field_of_expertise
     FROM expert_sessions s
     JOIN industry_experts e ON e.id = s.expert_id
     WHERE s.user_id = ?
     ORDER BY s.scheduled_date DESC`,
    [userId],
  );

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = bookSessionSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { expert_id, scheduled_date, duration_minutes, skill_domain, notes } = parsed.data;
  const coinCost  = 3000;
  const sessionId = crypto.randomUUID();

  // MySQL DATETIME(3) requires 'YYYY-MM-DD HH:MM:SS.mmm', not ISO 8601 'Z' suffix
  const mysqlDate = new Date(scheduled_date)
    .toISOString()
    .replace('T', ' ')
    .replace('Z', '');

  try {
    await deductCoins(userId, coinCost, 'SESSION_REDEEM', 'Booked an expert session', sessionId);
  } catch {
    return NextResponse.json({ error: 'Insufficient coins' }, { status: 402 });
  }

  await query(
    `INSERT INTO expert_sessions
      (id, user_id, expert_id, scheduled_date, duration_minutes, coin_cost, skill_domain, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [sessionId, userId, expert_id, mysqlDate, duration_minutes, coinCost, skill_domain ?? null, notes ?? null],
  );

  // Fire-and-forget: notify the expert (in-app + email)
  notifyExpertOfBooking(expert_id, userId, sessionId, skill_domain, scheduled_date, duration_minutes, notes);

  return NextResponse.json({ id: sessionId }, { status: 201 });
}
