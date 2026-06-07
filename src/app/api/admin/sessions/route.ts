import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  if (role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sessions = await query<any>(
    `SELECT s.id, s.scheduled_date, s.duration_minutes, s.status,
            s.coin_cost, s.meeting_link, s.notes, s.created_at,
            s.skill_domain,
            u.name AS user_name, u.email AS user_email,
            e.name AS expert_name, e.field_of_expertise
     FROM expert_sessions s
     JOIN users u ON u.id = s.user_id
     JOIN industry_experts e ON e.id = s.expert_id
     ORDER BY s.created_at DESC
     LIMIT 200`,
  );

  return NextResponse.json({ sessions });
}
