import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { awardCoins, deductCoins } from '@/lib/coins';
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

  const [post] = await query<{ title: string; content: string }>(
    'SELECT title, content FROM community_posts WHERE id = ?',
    [postId],
  );
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  // Evaluate quality BEFORE saving — only post if Excellent or Good
  let analysis = null;
  try {
    analysis = await analyzeAnswer(post.title, post.content, parsed.data.content);
  } catch {
    // If OpenAI is unavailable, allow the answer through
  }

  const isAcceptable = !analysis || analysis.quality === 'Excellent' || analysis.quality === 'Good';

  if (!isAcceptable) {
    // Deduct 30 coins as a penalty for a wrong answer
    let coinDelta = 0;
    try {
      await deductCoins(userId, 30, 'COMMUNITY_SPEND', 'Wrong answer penalty', postId);
      coinDelta = -30;
    } catch {
      // Insufficient balance — no deduction, coinDelta stays 0
    }
    return NextResponse.json({ posted: false, analysis, coinDelta }, { status: 200 });
  }

  const answerId   = crypto.randomUUID();
  const coinReward = 50;

  await query(
    `INSERT INTO community_answers (id, post_id, user_id, content, coin_reward)
     VALUES (?, ?, ?, ?, ?)`,
    [answerId, postId, userId, parsed.data.content, coinReward],
  );

  await awardCoins(userId, coinReward, 'COMMUNITY_EARN', 'Answered a community question', answerId);

  if (analysis) {
    await query(
      'UPDATE community_answers SET ai_analysis = ? WHERE id = ?',
      [JSON.stringify(analysis), answerId],
    );
  }

  return NextResponse.json({ posted: true, id: answerId, analysis, coinDelta: coinReward }, { status: 201 });
}
