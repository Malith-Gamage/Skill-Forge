import { cookies } from 'next/headers';
import { verifyJWT, SessionPayload } from './jwt';

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get('skillforge_session')?.value;
  if (!token) return null;
  return verifyJWT(token);
}

export async function requireAuth(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new Error('Unauthenticated');
  return s;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const s = await requireAuth();
  if (s.role !== 'ADMIN') throw new Error('Forbidden');
  return s;
}
