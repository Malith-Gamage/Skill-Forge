import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { deductCoins } from '@/lib/coins';
import { bookSessionSchema } from '@/lib/validators';

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

  try {
    await deductCoins(userId, coinCost, 'SESSION_REDEEM', 'Booked an expert session', sessionId);
  } catch {
    return NextResponse.json({ error: 'Insufficient coins' }, { status: 402 });
  }

  await query(
    `INSERT INTO expert_sessions
      (id, user_id, expert_id, scheduled_date, duration_minutes, coin_cost, skill_domain, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [sessionId, userId, expert_id, scheduled_date, duration_minutes, coinCost, skill_domain ?? null, notes ?? null],
  );

  return NextResponse.json({ id: sessionId }, { status: 201 });
}
