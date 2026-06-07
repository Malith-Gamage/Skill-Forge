import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Flip rescheduled tasks whose rescheduled_date has arrived back to PENDING
  const result = await query<any>(
    `UPDATE daily_tasks
     SET status = 'PENDING', rescheduled_date = NULL
     WHERE status = 'RESCHEDULED'
       AND rescheduled_date <= CURDATE()`,
  );

  const affected = (result as any).affectedRows ?? 0;

  return NextResponse.json({ success: true, tasksReactivated: affected });
}
