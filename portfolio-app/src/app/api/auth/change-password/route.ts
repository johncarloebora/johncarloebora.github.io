export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getCsrfFromRequest } from '@/lib/utils/auth';
import { verifyCsrfToken } from '@/lib/utils/csrf';

const WORKER = 'https://carlo-portfolio-api.johncarloebora.workers.dev';

export async function POST(req: NextRequest) {
  const csrf = getCsrfFromRequest(req);
  const csrfHeader = req.headers.get('X-CSRF-Token') ?? undefined;
  if (!verifyCsrfToken(csrf, csrfHeader)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const res = await fetch(`${WORKER}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
