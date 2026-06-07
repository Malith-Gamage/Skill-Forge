import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { awardCoins } from '@/lib/coins';
import { answerSchema } from '@/lib/validators';
import { analyzeAnswer } from '@/lib/openai';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId } = await params;

  const answers = await query<any>(
    `SELECT a.id, a.content, a.is_accepted, a.coin_reward, a.created_at,
            u.name AS author_name
     FROM community_answers a
     JOIN users u ON u.id = a.user_id
     WHERE a.post_id = ?
     ORDER BY a.is_accepted DESC, a.created_at ASC`,
    [postId],
  );

  return NextResponse.json(answers.map((a) => ({ ...a, is_accepted: !!a.is_accepted })));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId } = await params;

  const body = await req.json();
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const answerId   = crypto.randomUUID();
  const coinReward = 100;

  // Fetch the question so the analysis has context
  const [post] = await query<{ title: string; content: string }>(
    'SELECT title, content FROM community_posts WHERE id = ?',
    [postId],
  );
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  await query(
    `INSERT INTO community_answers (id, post_id, user_id, content, coin_reward)
     VALUES (?, ?, ?, ?, ?)`,
    [answerId, postId, userId, parsed.data.content, coinReward],
  );

  await awardCoins(userId, coinReward, 'COMMUNITY_EARN', 'Answered a community question', answerId);

  // Analyse the answer with OpenAI; store result but don't fail the request if it errors
  let analysis = null;
  try {
    analysis = await analyzeAnswer(post.title, post.content, parsed.data.content);
    await query(
      'UPDATE community_answers SET ai_analysis = ? WHERE id = ?',
      [JSON.stringify(analysis), answerId],
    );
  } catch {
    // analysis is non-critical — answer is already saved
  }

  return NextResponse.json({ id: answerId, analysis }, { status: 201 });
}
