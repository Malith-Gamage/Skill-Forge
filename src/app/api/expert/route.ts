import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  const experts = await query(
    `SELECT id, name, bio, rate_per_hour,
            field_of_expertise AS field,
            field_of_expertise AS expertise,
            availability_status AS availability,
            (availability_status = 'AVAILABLE') AS is_available
     FROM industry_experts
     WHERE availability_status = 'AVAILABLE'
     ORDER BY name ASC`,
  );

  return NextResponse.json(experts);
}
