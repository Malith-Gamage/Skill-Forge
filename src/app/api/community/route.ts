import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { deductCoins } from '@/lib/coins';
import { communityPostSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const domain = searchParams.get('domain');
  const status = searchParams.get('status');

  const conditions: string[] = [];
  const params: string[] = [];

  if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  }
  if (domain) {
    conditions.push('p.skill_domain = ?');
    params.push(domain);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const posts = await query<any>(
    `SELECT p.id, p.title, p.skill_domain, p.status, p.coin_cost, p.created_at,
            u.name AS user_name,
            COUNT(a.id) AS answer_count
     FROM community_posts p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN community_answers a ON a.post_id = p.id
     ${where}
     GROUP BY p.id
     ORDER BY p.created_at DESC
     LIMIT 50`,
    params,
  );

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = communityPostSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { title, content, skill_domain } = parsed.data;
  const coinCost = 100;

  try {
    await deductCoins(userId, coinCost, 'COMMUNITY_SPEND', 'Posted a community question');
  } catch {
    return NextResponse.json({ error: 'Insufficient coins' }, { status: 402 });
  }

  const postId = crypto.randomUUID();
  await query(
    `INSERT INTO community_posts (id, user_id, title, content, skill_domain, coin_cost)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [postId, userId, title, content, skill_domain ?? null, coinCost],
  );

  return NextResponse.json({ id: postId }, { status: 201 });
}
