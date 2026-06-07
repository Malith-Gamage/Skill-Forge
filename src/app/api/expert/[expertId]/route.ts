import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ expertId: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { expertId } = await params;

  const [expert] = await query<any>(
    `SELECT id, name, email, bio, rate_per_hour,
            field_of_expertise AS field,
            field_of_expertise AS expertise,
            availability_status AS availability,
            (availability_status = 'AVAILABLE') AS is_available
     FROM industry_experts WHERE id = ?`,
    [expertId],
  );

  if (!expert) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  expert.is_available = !!expert.is_available;
  return NextResponse.json(expert);
}
