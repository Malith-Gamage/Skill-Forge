import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/verify-email'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const PUBLIC_API_AUTH = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
  ];

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_API_AUTH.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/achievements') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon');

  if (isPublic) return NextResponse.next();

  const token = req.cookies.get('skillforge_session')?.value;

  if (!token)
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, req.url));

  const session = await verifyJWT(token);

  if (!session) {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete('skillforge_session');
    return res;
  }

  if (session.role === 'SUSPENDED') {
    const res = NextResponse.redirect(new URL('/login?error=suspended', req.url));
    res.cookies.delete('skillforge_session');
    return res;
  }

  if (
    (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) &&
    session.role !== 'ADMIN'
  ) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const headers = new Headers(req.headers);
  headers.set('x-user-id', session.userId);
  headers.set('x-user-email', session.email);
  headers.set('x-user-role', session.role);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
