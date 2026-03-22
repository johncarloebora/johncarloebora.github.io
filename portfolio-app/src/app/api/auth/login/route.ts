import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies } from '@/lib/utils/auth';
import { generateCsrfToken } from '@/lib/utils/csrf';

const WORKER = process.env.WORKER_API_BASE ?? 'https://carlo-portfolio-api.johncarloebora.workers.dev';

export async function POST(req: NextRequest) {
  try {
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

    const csrf = await generateCsrfToken();
    const response = NextResponse.json({ success: true });
    setAuthCookies(response, data.token, csrf);
    return response;
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
