export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

const TOKEN_COOKIE = 'admin_token';
const CSRF_COOKIE  = 'csrf_token';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

export async function POST(req: NextRequest) {
  try {
    const WORKER = process.env.WORKER_API_BASE ?? 'https://carlo-portfolio-api.johncarloebora.workers.dev';
    const body = await req.json();

    const res = await fetch(`${WORKER}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json() as { token?: string; error?: string };

    if (!res.ok || !data.token) {
      return NextResponse.json({ error: data.error ?? 'Login failed' }, { status: res.status });
    }

    // Generate CSRF token inline (avoid import issues on edge)
    const buf = crypto.getRandomValues(new Uint8Array(32));
    const csrf = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');

    const response = NextResponse.json({ success: true });
    const cookieOpts = { maxAge: COOKIE_MAX_AGE, path: '/', sameSite: 'strict' as const, secure: true };
    response.cookies.set(TOKEN_COOKIE, data.token, { ...cookieOpts, httpOnly: true });
    response.cookies.set(CSRF_COOKIE,  csrf,        { ...cookieOpts, httpOnly: false });
    return response;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
