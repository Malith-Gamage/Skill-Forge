import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { generateRoadmap } from '@/lib/openai';
import { roadmapSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const roadmaps = await query(
      `SELECT id, title, skill_domain, status, total_checkpoints, created_at
       FROM roadmaps
       WHERE user_id = ? AND status != 'REMOVED'
       ORDER BY created_at DESC`,
      [userId],
    );

    return NextResponse.json(roadmaps);
  } catch (err: any) {
    console.error('[ROADMAP GET]', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = roadmapSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { skill } = parsed.data;
    const roadmapId = crypto.randomUUID();

    const generated = await generateRoadmap(skill);

    await query(
      `INSERT INTO roadmaps (id, user_id, title, skill_domain, status, total_checkpoints)
       VALUES (?, ?, ?, ?, 'ACTIVE', ?)`,
      [roadmapId, userId, generated.title, skill, generated.checkpoints.length],
    );

    for (let i = 0; i < generated.checkpoints.length; i++) {
      const cp = generated.checkpoints[i];
      const checkpointId = crypto.randomUUID();
      const status = i === 0 ? 'IN_PROGRESS' : 'LOCKED';
      await query(
        `INSERT INTO checkpoints (id, roadmap_id, title, order_index, status, coins_awarded)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [checkpointId, roadmapId, cp.title, cp.order_index, status, cp.coins_awarded],
      );

      const tasks = Array.isArray(cp.tasks) ? cp.tasks : [];
      const taskReward = tasks.length
        ? Math.max(1, Math.floor(cp.coins_awarded / tasks.length))
        : 10;
      for (const taskTitle of tasks) {
        await query(
          `INSERT INTO daily_tasks (id, checkpoint_id, user_id, title, coin_reward)
           VALUES (?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), checkpointId, userId, taskTitle, taskReward],
        );
      }
    }

    return NextResponse.json({ id: roadmapId }, { status: 201 });
  } catch (err: any) {
    console.error('[ROADMAP POST]', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
