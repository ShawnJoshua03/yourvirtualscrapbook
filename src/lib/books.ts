import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseForUser, supabaseAdmin, publicMediaUrl } from './supabase/server';
import type { Book, PageConfig } from '@/engine/types';

export type BookRow = {
  id: string;
  owner_id: string;
  recipient_name: string;
  nickname: string;
  age: number;
  birthday: string;
  sign: string | null;
  from_name: string;
  letter: string;
  invite_token: string;
  public_slug: string | null;
  status: 'collecting' | 'published';
  created_at: string;
};
export type MediaRow = { id: string; contribution_id: string; kind: 'photo' | 'video'; path: string; thumb_path: string; w: number; h: number; position: number };
export type ContributionRow = { id: string; book_id: string; name: string; note: string; page: PageOptions; position: number; created_at: string; media: MediaRow[] };
export type PageOptions = { style: PageConfig['style']; [option: string]: unknown };

/** The signed-in organizer's user id, verified with Supabase, or null. */
export async function currentUserId(): Promise<string | null> {
  const supabase = await supabaseForUser();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

export async function requireUserId(): Promise<string> {
  const id = await currentUserId();
  if (!id) redirect('/login');
  return id;
}

export async function listMyBooks() {
  await requireUserId();
  const supabase = await supabaseForUser();
  const { data, error } = await supabase
    .from('books')
    .select('id, recipient_name, nickname, age, status, public_slug, created_at, contributions(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(b => ({ ...b, contributionCount: (b.contributions as unknown as { count: number }[])[0]?.count ?? 0 }));
}

/** One of the organizer's books with everything in it, or null if it isn't theirs (row-level security hides it). */
export async function getMyBook(id: string): Promise<{ book: BookRow; contributions: ContributionRow[] } | null> {
  await requireUserId();
  if (!isUuid(id)) return null;
  const supabase = await supabaseForUser();
  const { data: book } = await supabase.from('books').select('*').eq('id', id).maybeSingle<BookRow>();
  if (!book) return null;
  const { data: contributions, error } = await supabase
    .from('contributions')
    .select('*, media(*)')
    .eq('book_id', id)
    .order('position')
    .order('created_at')
    .order('position', { referencedTable: 'media' });
  if (error) throw error;
  return { book, contributions: (contributions ?? []) as ContributionRow[] };
}

/** What a contributor's invite link opens: just enough to greet them, and only while the book is collecting. */
export async function bookForInvite(token: string) {
  if (!/^[a-f0-9]{24}$/.test(token)) return null;
  const { data } = await supabaseAdmin()
    .from('books')
    .select('id, recipient_name, nickname, from_name, status')
    .eq('invite_token', token)
    .maybeSingle();
  return data;
}

/** A published book by its public slug, assembled for the engine. */
export async function publishedBook(slug: string): Promise<Book | null> {
  if (!/^[a-z0-9]{10,40}$/.test(slug)) return null;
  const admin = supabaseAdmin();
  const { data: book } = await admin.from('books').select('*').eq('public_slug', slug).eq('status', 'published').maybeSingle<BookRow>();
  if (!book) return null;
  const { data: contributions } = await admin
    .from('contributions')
    .select('*, media(*)')
    .eq('book_id', book.id)
    .order('position')
    .order('created_at')
    .order('position', { referencedTable: 'media' });
  return toEngineBook(book, (contributions ?? []) as ContributionRow[]);
}

const DEFAULT_STAR_NOTES = [
  'you light up every room you walk into', 'your laugh is the best sound', 'the world is softer with you in it',
  'you make everyone feel at home', 'so, so proud of you', 'you deserve every good thing coming your way',
  'never stop being exactly you', 'lucky us, we get to know you',
];

/** Turns database rows into the Book the engine renders. Friends share a page per name, so repeats get numbered. */
export function toEngineBook(book: BookRow, contributions: ContributionRow[]): Book {
  const seen = new Map<string, number>();
  const unique = contributions.map(c => {
    const n = (seen.get(c.name.toLowerCase()) ?? 0) + 1;
    seen.set(c.name.toLowerCase(), n);
    return { ...c, name: n > 1 ? `${c.name} ${n}` : c.name };
  });
  return {
    config: {
      name: book.recipient_name,
      nickname: book.nickname,
      age: book.age,
      birthday: book.birthday,
      sign: book.sign ?? undefined,
      from: book.from_name,
      friends: unique.map(c => ({ ...(c.page ?? { style: 'auto' }), name: c.name }) as PageConfig),
      letter: book.letter.split(/\n\s*\n|\n/).map(s => s.trim()).filter(Boolean),
      starNotes: DEFAULT_STAR_NOTES,
    },
    contributions: unique.map(c => ({
      name: c.name,
      note: c.note,
      media: c.media.map(m => ({ type: m.kind, src: publicMediaUrl(m.path), thumb: publicMediaUrl(m.thumb_path), w: m.w, h: m.h })),
    })),
  };
}

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
