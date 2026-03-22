// Server-side fetch to the Cloudflare Worker — uses the auth cookie
import { getToken } from '@/lib/utils/auth';

const BASE = process.env.WORKER_API_BASE ?? 'https://carlo-portfolio-api.johncarloebora.workers.dev';

interface FetchOptions extends RequestInit {
  auth?: boolean;
}

export async function workerFetch(path: string, opts: FetchOptions = {}) {
  const { auth = false, ...rest } = opts;

  const headers = new Headers(rest.headers as HeadersInit | undefined);

  if (auth) {
    const token = await getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');

  const res = await fetch(`${BASE}${path}`, { ...rest, headers });
  return res;
}

export async function workerGet<T>(path: string, auth = false): Promise<T> {
  const res = await workerFetch(path, { method: 'GET', auth });
  if (!res.ok) throw new Error(`Worker GET ${path} → ${res.status}`);
  return res.json();
}
