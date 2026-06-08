import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const userEmail = req.headers.get('x-user-email');
    if (!userId || !userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { fullName, bio, fieldOfExpertise, skills, yearsExperience, hourlyRate, linkedinUrl } = body;

    if (!fullName?.trim() || !fieldOfExpertise?.trim()) {
      return NextResponse.json({ error: 'Full name and field of expertise are required' }, { status: 400 });
    }

    // Ensure mapping table exists
    try {
      await query(
        `CREATE TABLE IF NOT EXISTS user_expert_map (
          user_id VARCHAR(36) NOT NULL PRIMARY KEY,
          expert_id VARCHAR(36) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      );
    } catch {
      // Table already exists — continue
    }

    // Prevent duplicate registrations
    try {
      const [existing] = await query<{ expert_id: string }>(
        `SELECT expert_id FROM user_expert_map WHERE user_id = ? LIMIT 1`,
        [userId]
      );
      if (existing) {
        return NextResponse.json({ error: 'You are already registered as an expert' }, { status: 409 });
      }
    } catch {
      // Table may not exist yet — treat as no entry
    }

    const expertId = crypto.randomUUID();

    // Add to industry_experts so they appear in the listing and can be booked
    await query(
      `INSERT INTO industry_experts (id, name, email, bio, field_of_expertise, availability_status, rate_per_hour)
       VALUES (?, ?, ?, ?, ?, 'AVAILABLE', ?)`,
      [
        expertId,
        fullName.trim(),
        userEmail,
        bio?.trim() || null,
        fieldOfExpertise.trim(),
        Number(hourlyRate) || 100,
      ]
    );

    // Record user → expert mapping
    try {
      await query(
        `INSERT INTO user_expert_map (user_id, expert_id) VALUES (?, ?)`,
        [userId, expertId]
      );
    } catch {
      // Non-critical — expert is live, map entry failed
    }

    return NextResponse.json({ expertId }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/expert]', err);
    return NextResponse.json({ error: 'Something went wrong — please try again' }, { status: 500 });
  }
}
