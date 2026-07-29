import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendSessionReminderEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find sessions scheduled for tomorrow (cron runs once daily, so cover the full next calendar day)
  const upcoming = await query<any>(
    `SELECT s.id, s.scheduled_date, s.duration_minutes,
            u.email, u.name AS user_name,
            e.name AS expert_name
     FROM expert_sessions s
     JOIN users u            ON u.id = s.user_id
     JOIN industry_experts e ON e.id = s.expert_id
     WHERE s.status IN ('PENDING', 'CONFIRMED')
       AND DATE(s.scheduled_date) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY))`,
  );

  let sent = 0;
  for (const session of upcoming) {
    try {
      const sessionDate = new Date(session.scheduled_date).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      await sendSessionReminderEmail(session.email, session.expert_name, sessionDate);

      // Record a notification so the user sees it in-app too
      await query(
        `INSERT INTO notifications (id, user_id, message, type, reference_id)
         VALUES (UUID(), (SELECT user_id FROM expert_sessions WHERE id = ?),
                 ?, 'SESSION_REMINDER', ?)`,
        [
          session.id,
          `Reminder: your session with ${session.expert_name} is tomorrow.`,
          session.id,
        ],
      );

      sent++;
    } catch (err: any) {
      console.error('[CRON session-reminders] failed for session', session.id, err.message);
    }
  }

  return NextResponse.json({ success: true, sent });
}
