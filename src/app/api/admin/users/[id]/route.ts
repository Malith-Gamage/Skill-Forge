import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = req.headers.get('x-user-role');
  if (role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { role: newRole } = await req.json();

  const allowed = ['LEARNER', 'ADMIN', 'EXPERT', 'SUSPENDED'];
  if (!allowed.includes(newRole))
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  await query('UPDATE users SET role = ? WHERE id = ?', [newRole, id]);

  return NextResponse.json({ success: true });
}
