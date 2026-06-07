import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  if (role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [[users], [roadmaps], [sessions], [coins]] = await Promise.all([
    query<any>('SELECT COUNT(*) AS total FROM users'),
    query<any>(`SELECT COUNT(*) AS total FROM roadmaps WHERE status = 'ACTIVE'`),
    query<any>(`SELECT COUNT(*) AS total FROM expert_sessions WHERE status = 'CONFIRMED'`),
    query<any>(`SELECT SUM(amount) AS total FROM coin_transactions WHERE direction = 'CREDIT'`),
  ]);

  return NextResponse.json({
    total_users:        users.total,
    active_roadmaps:    roadmaps.total,
    confirmed_sessions: sessions.total,
    coins_awarded:      coins.total ?? 0,
  });
}
