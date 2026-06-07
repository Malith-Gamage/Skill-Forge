import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  if (role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const experts = await query(
    `SELECT id, name, email, field_of_expertise, bio, availability_status, meeting_link
     FROM industry_experts
     ORDER BY name ASC`,
  );

  return NextResponse.json({ experts });
}

export async function POST(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  if (role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, email, fieldOfExpertise, bio, availabilityStatus, meetingLink } = await req.json();

  if (!name || !email || !fieldOfExpertise)
    return NextResponse.json({ error: 'Name, email and field are required' }, { status: 400 });

  const id = crypto.randomUUID();
  await query(
    `INSERT INTO industry_experts (id, name, email, field_of_expertise, bio, availability_status, meeting_link)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name, email, fieldOfExpertise, bio ?? null, availabilityStatus ?? 'AVAILABLE', meetingLink ?? null],
  );

  return NextResponse.json({ id }, { status: 201 });
}
