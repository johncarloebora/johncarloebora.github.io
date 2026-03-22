import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in-memory, resets on cold start — acceptable for edge)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 min
const RATE_LIMIT_MAX = 10;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit the login endpoint
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const entry = loginAttempts.get(ip);

    if (entry && now < entry.resetAt) {
      if (entry.count >= RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: 'Too many login attempts. Try again in 15 minutes.' },
          { status: 429 }
        );
      }
      entry.count++;
    } else {
      loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    }
  }

  // Protect admin routes — check cookie exists (full verify happens server-side)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = req.cookies.get('admin_token')?.value;
    if (!token && !pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/auth/login'],
};
