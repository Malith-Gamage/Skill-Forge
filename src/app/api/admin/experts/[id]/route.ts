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
  const { name, email, fieldOfExpertise, bio, availabilityStatus, meetingLink } = await req.json();

  if (!name || !email || !fieldOfExpertise)
    return NextResponse.json({ error: 'Name, email and field are required' }, { status: 400 });

  await query(
    `UPDATE industry_experts
     SET name = ?, email = ?, field_of_expertise = ?, bio = ?,
         availability_status = ?, meeting_link = ?
     WHERE id = ?`,
    [name, email, fieldOfExpertise, bio ?? null, availabilityStatus ?? 'AVAILABLE', meetingLink ?? null, id],
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = _req.headers.get('x-user-role');
  if (role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  await query('DELETE FROM industry_experts WHERE id = ?', [id]);

  return NextResponse.json({ success: true });
}
