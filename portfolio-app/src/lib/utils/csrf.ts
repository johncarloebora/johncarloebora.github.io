// CSRF token generation and verification using Web Crypto
// Compatible with Edge runtime

export async function generateCsrfToken(): Promise<string> {
  const buf = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function verifyCsrfToken(cookie: string | undefined, header: string | undefined): boolean {
  if (!cookie || !header) return false;
  // Constant-time compare
  if (cookie.length !== header.length) return false;
  let result = 0;
  for (let i = 0; i < cookie.length; i++) {
    result |= cookie.charCodeAt(i) ^ header.charCodeAt(i);
  }
  return result === 0;
}
