import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find users with pending tasks scheduled for today and create TASK_REMINDER notifications
  const tasks = await query<any>(
    `SELECT t.id AS task_id, t.user_id, t.title
     FROM daily_tasks t
     WHERE t.status = 'PENDING'
       AND (t.scheduled_date = CURDATE() OR t.scheduled_date IS NULL)
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.user_id    = t.user_id
           AND n.type       = 'TASK_REMINDER'
           AND n.reference_id = t.id
           AND DATE(n.sent_at) = CURDATE()
       )
     LIMIT 500`,
  );

  let created = 0;
  for (const task of tasks) {
    try {
      await query(
        `INSERT INTO notifications (id, user_id, message, type, reference_id)
         VALUES (UUID(), ?, ?, 'TASK_REMINDER', ?)`,
        [task.user_id, `Don't forget your task: ${task.title}`, task.task_id],
      );
      created++;
    } catch (err: any) {
      console.error('[CRON notifications] failed for task', task.task_id, err.message);
    }
  }

  return NextResponse.json({ success: true, notificationsCreated: created });
}
