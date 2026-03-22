export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getCsrfFromRequest } from '@/lib/utils/auth';
import { verifyCsrfToken } from '@/lib/utils/csrf';

const WORKER = process.env.WORKER_API_BASE ?? 'https://carlo-portfolio-api.johncarloebora.workers.dev';

async function handler(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  const pathParts = params.path ?? [];
  const workerPath = '/api/' + pathParts.join('/');

  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // CSRF check for mutating methods
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const csrf = getCsrfFromRequest(req);
    const csrfHeader = req.headers.get('X-CSRF-Token') ?? undefined;
    if (!verifyCsrfToken(csrf, csrfHeader)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }
  }

  // Build forwarded headers
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);

  const contentType = req.headers.get('Content-Type');

  let body: BodyInit | null = null;

  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (contentType?.includes('multipart/form-data')) {
      // Forward form data as-is (media upload)
      body = await req.formData();
    } else {
      headers.set('Content-Type', 'application/json');
      const text = await req.text();
      body = text || null;
    }
  }

  try {
    const res = await fetch(`${WORKER}${workerPath}`, {
      method: req.method,
      headers,
      body,
    });

    const resContentType = res.headers.get('Content-Type') ?? 'application/json';
    const resBody = await res.text();

    return new NextResponse(resBody, {
      status: res.status,
      headers: { 'Content-Type': resContentType },
    });
  } catch (err) {
    console.error('Proxy error:', err);
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
