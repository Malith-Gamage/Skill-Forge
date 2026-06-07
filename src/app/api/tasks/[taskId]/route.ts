import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { awardCoins } from '@/lib/coins';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { taskId } = await params;
  const { status, rescheduled_date } = await req.json();

  const [task] = await query<any>(
    'SELECT * FROM daily_tasks WHERE id = ? AND user_id = ?',
    [taskId, userId],
  );
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  // Handle reschedule
  if (status === 'RESCHEDULED' && rescheduled_date) {
    await query(
      `UPDATE daily_tasks SET status = 'RESCHEDULED', rescheduled_date = ? WHERE id = ?`,
      [rescheduled_date, taskId],
    );
    return NextResponse.json({ success: true });
  }

  if (status !== 'COMPLETED')
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  if (task.status !== 'PENDING')
    return NextResponse.json({ error: 'Task already completed' }, { status: 400 });

  // Mark task complete
  await query(
    `UPDATE daily_tasks SET status = 'COMPLETED', completed_at = NOW(3) WHERE id = ?`,
    [taskId],
  );

  // Award coins
  await awardCoins(userId, task.coin_reward, 'TASK_REWARD', `Completed task: ${task.title}`, taskId);

  // Increment learning streak
  await query(
    'UPDATE profiles SET learning_streak = learning_streak + 1 WHERE user_id = ?',
    [userId],
  );

  // Check if all of this user's tasks in the checkpoint are now complete
  const [counts] = await query<any>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS done
     FROM daily_tasks WHERE checkpoint_id = ? AND user_id = ?`,
    [task.checkpoint_id, userId],
  );

  let checkpointCompleted = false;
  if (Number(counts.total) > 0 && Number(counts.total) === Number(counts.done)) {
    // Mark checkpoint complete
    await query(
      `UPDATE checkpoints SET status = 'COMPLETED' WHERE id = ?`,
      [task.checkpoint_id],
    );

    // Award checkpoint completion bonus
    await awardCoins(userId, 30, 'CHECKPOINT_REWARD', 'Completed a checkpoint', task.checkpoint_id);

    // Award a checkpoint badge
    const badgeId = crypto.randomUUID();
    await query(
      `INSERT INTO badges (id, user_id, checkpoint_id, badge_type) VALUES (?, ?, ?, 'CHECKPOINT')`,
      [badgeId, userId, task.checkpoint_id],
    );

    // Unlock the next checkpoint or mark roadmap complete
    const [checkpoint] = await query<any>(
      'SELECT roadmap_id, order_index FROM checkpoints WHERE id = ?',
      [task.checkpoint_id],
    );
    const [nextCheckpoint] = await query<any>(
      `SELECT id FROM checkpoints WHERE roadmap_id = ? AND order_index = ?`,
      [checkpoint.roadmap_id, checkpoint.order_index + 1],
    );
    if (nextCheckpoint) {
      await query(
        `UPDATE checkpoints SET status = 'IN_PROGRESS' WHERE id = ?`,
        [nextCheckpoint.id],
      );
    } else {
      // All checkpoints done — mark roadmap complete
      await query(
        `UPDATE roadmaps SET status = 'COMPLETED' WHERE id = ?`,
        [checkpoint.roadmap_id],
      );
    }

    checkpointCompleted = true;
  }

  return NextResponse.json({
    success: true,
    coinsAwarded: task.coin_reward,
    checkpointCompleted,
  });
}
