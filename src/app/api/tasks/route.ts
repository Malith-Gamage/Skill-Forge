import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { reactivateDueTasks } from '@/lib/tasks';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await reactivateDueTasks(userId);

  const tasks = await query<any>(
    `SELECT dt.id, dt.title, dt.status, dt.coin_reward, dt.scheduled_date, dt.completed_at,
            r.skill_domain
     FROM daily_tasks dt
     JOIN checkpoints c ON c.id = dt.checkpoint_id
     JOIN roadmaps r ON r.id = c.roadmap_id
     WHERE dt.user_id = ?
       AND (dt.scheduled_date <= CURDATE() OR dt.scheduled_date IS NULL)
     ORDER BY FIELD(dt.status, 'PENDING', 'RESCHEDULED', 'COMPLETED'), dt.created_at ASC
     LIMIT 20`,
    [userId],
  );

  return NextResponse.json(tasks);
}
