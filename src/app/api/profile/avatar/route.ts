import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { uploadAvatar } from '@/lib/cloudinary';

export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('avatar');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const avatarUrl = await uploadAvatar(buffer, userId);

    await query('UPDATE profiles SET avatar_url = ? WHERE user_id = ?', [avatarUrl, userId]);

    return NextResponse.json({ avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
