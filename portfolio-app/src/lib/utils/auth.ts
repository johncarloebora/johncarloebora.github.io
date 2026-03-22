import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const TOKEN_COOKIE = 'admin_token';
const CSRF_COOKIE  = 'csrf_token';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

export async function getToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value;
}

export function setAuthCookies(res: NextResponse, token: string, csrf: string) {
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  // Readable CSRF cookie (not httpOnly — JS can read it)
  res.cookies.set(CSRF_COOKIE, csrf, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(TOKEN_COOKIE, '', { maxAge: 0, path: '/' });
  res.cookies.set(CSRF_COOKIE,  '', { maxAge: 0, path: '/' });
}

export function getTokenFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get(TOKEN_COOKIE)?.value;
}

export function getCsrfFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get(CSRF_COOKIE)?.value;
}
