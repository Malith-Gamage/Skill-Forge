import { query } from '@/lib/db';

export async function reactivateDueTasks(userId: string) {
  await query(
    `UPDATE daily_tasks
     SET status = 'PENDING', rescheduled_date = NULL
     WHERE user_id = ?
       AND status = 'RESCHEDULED'
       AND rescheduled_date <= CURDATE()`,
    [userId],
  );
}

export async function generateTaskReminders(userId: string) {
  const tasks = await query<{ task_id: string; title: string }>(
    `SELECT t.id AS task_id, t.title
     FROM daily_tasks t
     WHERE t.user_id = ?
       AND t.status = 'PENDING'
       AND (t.scheduled_date = CURDATE() OR t.scheduled_date IS NULL)
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.user_id = t.user_id
           AND n.type = 'TASK_REMINDER'
           AND n.reference_id = t.id
           AND DATE(n.sent_at) = CURDATE()
       )`,
    [userId],
  );

  for (const task of tasks) {
    await query(
      `INSERT INTO notifications (id, user_id, message, type, reference_id)
       VALUES (UUID(), ?, ?, 'TASK_REMINDER', ?)`,
      [userId, `Don't forget your task: ${task.title}`, task.task_id],
    );
  }
}
