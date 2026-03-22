export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== 'a8e765dfbcd6528d2e8e67b3fa63cd205b9916a72925b7ed63ec0cc6169286ff') {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }
  revalidatePath('/');
  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
