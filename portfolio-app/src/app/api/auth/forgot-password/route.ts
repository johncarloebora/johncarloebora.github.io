import { NextRequest, NextResponse } from 'next/server';

const WORKER = process.env.WORKER_API_BASE ?? 'https://carlo-portfolio-api.johncarloebora.workers.dev';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${WORKER}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
