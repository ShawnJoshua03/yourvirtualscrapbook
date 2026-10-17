/* POST {contributionId, name, note, media: [{kind, path, thumbPath, w, h}]} → saves a friend's page.
   Every file must already be in storage under this contribution's folder, so nobody can attach someone else's files. */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { collectingBook, contributionExists, contributionPrefix, isUuid, MAX_MEDIA } from '@/lib/invite';

type Item = { kind: 'photo' | 'video'; path: string; thumbPath: string; w: number; h: number };

export async function POST(request: Request, { params }: RouteContext<'/api/invite/[token]/submit'>) {
  const { token } = await params;
  const book = await collectingBook(token);
  if (!book) return NextResponse.json({ error: 'This invite link isn’t open any more.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const contributionId = body?.contributionId;
  if (!isUuid(contributionId)) return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  // a retry after a dropped connection: it already went through
  if (await contributionExists(contributionId)) return NextResponse.json({ ok: true, repeat: true });

  const name = String(body?.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
  const note = String(body?.note ?? '').trim().slice(0, 4000);
  const items: Item[] = Array.isArray(body?.media) ? body.media : [];
  if (!name) return NextResponse.json({ error: 'Add your name.' }, { status: 400 });
  if (!note && !items.length) return NextResponse.json({ error: 'Add a note or at least one photo.' }, { status: 400 });
  if (items.length > MAX_MEDIA) return NextResponse.json({ error: `Up to ${MAX_MEDIA} photos and videos.` }, { status: 400 });

  const prefix = contributionPrefix(book.id, contributionId);
  const admin = supabaseAdmin();
  const { data: stored } = await admin.storage.from('media').list(prefix.slice(0, -1), { limit: 1000 });
  const present = new Set((stored ?? []).map(o => prefix + o.name));
  const clean = (n: unknown) => Math.max(1, Math.min(10000, Math.round(Number(n) || 0)));
  for (const m of items) {
    if (!['photo', 'video'].includes(m?.kind) || !present.has(m.path) || !present.has(m.thumbPath)) {
      return NextResponse.json({ error: 'Some uploads didn’t finish. Try sending again.' }, { status: 400 });
    }
  }

  const { count } = await admin.from('contributions').select('id', { count: 'exact', head: true }).eq('book_id', book.id);
  const { error } = await admin.from('contributions').insert({ id: contributionId, book_id: book.id, name, note, position: count ?? 0 });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ ok: true, repeat: true }); // two retries raced
    return NextResponse.json({ error: 'Couldn’t save your page. Try again.' }, { status: 500 });
  }
  if (items.length) {
    const { error: mediaError } = await admin.from('media').insert(items.map((m, i) => ({
      contribution_id: contributionId, book_id: book.id, kind: m.kind, path: m.path, thumb_path: m.thumbPath, w: clean(m.w), h: clean(m.h), position: i,
    })));
    if (mediaError) {
      await admin.from('contributions').delete().eq('id', contributionId); // all or nothing, so a retry starts clean
      return NextResponse.json({ error: 'Couldn’t save your photos. Try again.' }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
