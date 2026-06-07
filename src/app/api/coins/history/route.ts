import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const transactions = await query(
    `SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
    [userId],
  );

  return NextResponse.json(transactions);
}
