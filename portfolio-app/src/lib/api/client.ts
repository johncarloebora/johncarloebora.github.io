'use client';

// Browser API client — all requests go through Next.js proxy routes
// The proxy attaches the httpOnly cookie Bearer token server-side

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match?.[1] ?? '';
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const isWrite = init.method && init.method !== 'GET';
  const headers = new Headers(init.headers as HeadersInit | undefined);

  if (isWrite) {
    headers.set('X-CSRF-Token', getCsrfToken());
  }

  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  } else {
    // Let browser set multipart boundary
    headers.delete('Content-Type');
  }

  const res = await fetch(`/api/proxy${path}`, { ...init, headers, credentials: 'same-origin' });

  if (res.status === 401) {
    window.location.href = '/admin/login';
  }

  return res;
}

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body?: unknown) =>
    apiFetch(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (path: string, body?: unknown) =>
    apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: 'DELETE' }),
  patch: (path: string, body?: unknown) =>
    apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
};
