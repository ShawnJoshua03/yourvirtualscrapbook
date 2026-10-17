/* POST {contributionId, files: [{type}]} → one signed upload slot per file.
   Files go straight from the phone to storage under <book>/<contribution>/, so big videos never pass through here. */
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { collectingBook, contributionExists, contributionPrefix, allowedMime, extFor, isUuid, MAX_MEDIA } from '@/lib/invite';

export async function POST(request: Request, { params }: RouteContext<'/api/invite/[token]/uploads'>) {
  const { token } = await params;
  const book = await collectingBook(token);
  if (!book) return NextResponse.json({ error: 'This invite link isn’t open any more.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const contributionId = body?.contributionId;
  const files: unknown[] = Array.isArray(body?.files) ? body.files : [];
  if (!isUuid(contributionId) || !files.length || files.length > MAX_MEDIA * 2) return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  if (await contributionExists(contributionId)) return NextResponse.json({ error: 'This page was already sent.' }, { status: 409 });

  const types = files.map(f => (f as { type?: unknown })?.type);
  if (!types.every(allowedMime)) return NextResponse.json({ error: 'Only photos and videos, please.' }, { status: 415 });

  const storage = supabaseAdmin().storage.from('media');
  const prefix = contributionPrefix(book.id, contributionId);
  const slots = [];
  for (const type of types) {
    const path = `${prefix}${randomUUID()}.${extFor(type)}`;
    const { data, error } = await storage.createSignedUploadUrl(path);
    if (error || !data) return NextResponse.json({ error: 'Couldn’t start the upload. Try again.' }, { status: 502 });
    slots.push({ path: data.path, token: data.token });
  }
  return NextResponse.json({ slots });
}
