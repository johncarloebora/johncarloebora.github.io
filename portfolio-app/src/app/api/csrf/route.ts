import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/utils/csrf';

export async function GET() {
  const token = await generateCsrfToken();
  const res = NextResponse.json({ token });
  res.cookies.set('csrf_token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
    path: '/',
  });
  return res;
}
