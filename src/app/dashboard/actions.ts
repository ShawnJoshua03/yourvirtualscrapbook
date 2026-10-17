'use server';

import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseForUser, supabaseAdmin } from '@/lib/supabase/server';
import { requireUserId, isUuid } from '@/lib/books';
import { STYLE_IDS } from '@/engine/catalog';
import { signOut as endSession } from '../login/actions';

export type FormState = { error?: string; saved?: boolean };

const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? '').trim().slice(0, max);

function bookFields(form: FormData) {
  const recipient_name = text(form, 'recipient_name', 60);
  const nickname = text(form, 'nickname', 30) || recipient_name;
  const from_name = text(form, 'from_name', 60);
  const birthday = text(form, 'birthday', 40);
  const age = Number(form.get('age'));
  if (!recipient_name || !from_name || !birthday) return { error: 'Fill in their name, the birthday and your name.' } as const;
  if (!Number.isInteger(age) || age < 1 || age > 130) return { error: 'Age should be a whole number.' } as const;
  return { fields: { recipient_name, nickname, from_name, birthday, age, sign: text(form, 'sign', 40) || null } } as const;
}

export async function createBook(_prev: FormState, form: FormData): Promise<FormState> {
  const owner_id = await requireUserId();
  const parsed = bookFields(form);
  if ('error' in parsed) return { error: parsed.error };
  const supabase = await supabaseForUser();
  const { data, error } = await supabase.from('books').insert({ ...parsed.fields, owner_id }).select('id').single();
  if (error) return { error: 'Couldn’t create the book. Try again.' };
  redirect(`/dashboard/${data.id}`);
}

export async function updateBook(bookId: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireUserId();
  if (!isUuid(bookId)) return { error: 'Unknown book.' };
  const parsed = bookFields(form);
  if ('error' in parsed) return { error: parsed.error };
  const supabase = await supabaseForUser();
  const { error } = await supabase.from('books').update({ ...parsed.fields, letter: text(form, 'letter', 6000) }).eq('id', bookId);
  if (error) return { error: 'Couldn’t save. Try again.' };
  revalidatePath(`/dashboard/${bookId}`);
  return { saved: true };
}

/** Saves how one friend's page looks: a style plus that style's options (titles, stamps, checkpoints…). */
export async function savePage(contributionId: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireUserId();
  if (!isUuid(contributionId)) return { error: 'Unknown contribution.' };
  const style = String(form.get('style'));
  if (!STYLE_IDS.has(style as never)) return { error: 'Pick a style from the list.' };
  let extra: Record<string, unknown> = {};
  const raw = text(form, 'options', 4000);
  if (raw) {
    try { extra = JSON.parse(raw); } catch { return { error: 'Extra options must be valid JSON, e.g. {"stamp": "LEGEND"}.' }; }
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return { error: 'Extra options must be a JSON object.' };
  }
  const page: Record<string, unknown> = { ...extra, style };
  const title = text(form, 'title', 80), quote = text(form, 'quote', 160);
  if (title) page.title = title; else delete page.title;
  if (quote) page.quote = quote; else delete page.quote;
  delete page.name; // the page's name always comes from the contribution
  const supabase = await supabaseForUser();
  const { data, error } = await supabase.from('contributions').update({ page }).eq('id', contributionId).select('book_id').maybeSingle();
  if (error || !data) return { error: 'Couldn’t save. Try again.' };
  revalidatePath(`/dashboard/${data.book_id}`);
  return { saved: true };
}

export async function removeContribution(contributionId: string) {
  await requireUserId();
  if (!isUuid(contributionId)) return;
  const supabase = await supabaseForUser();
  // read through row-level security first: this only finds it if the book is theirs
  const { data: c } = await supabase.from('contributions').select('book_id, media(path, thumb_path)').eq('id', contributionId).maybeSingle();
  if (!c) return;
  await supabase.from('contributions').delete().eq('id', contributionId);
  const paths = (c.media as { path: string; thumb_path: string }[]).flatMap(m => [m.path, m.thumb_path]);
  if (paths.length) await supabaseAdmin().storage.from('media').remove(paths);
  revalidatePath(`/dashboard/${c.book_id}`);
}

export async function setPublished(bookId: string, publish: boolean) {
  await requireUserId();
  if (!isUuid(bookId)) return;
  const supabase = await supabaseForUser();
  const { data: book } = await supabase.from('books').select('public_slug').eq('id', bookId).maybeSingle();
  if (!book) return;
  await supabase.from('books').update(publish
    ? { status: 'published', public_slug: book.public_slug ?? randomBytes(12).toString('hex').slice(0, 20) } // keep the same link if re-published
    : { status: 'collecting' }).eq('id', bookId);
  revalidatePath(`/dashboard/${bookId}`);
}

/** A fresh invite link; the old one stops working straight away. */
export async function rotateInvite(bookId: string) {
  await requireUserId();
  if (!isUuid(bookId)) return;
  const supabase = await supabaseForUser();
  await supabase.from('books').update({ invite_token: randomBytes(12).toString('hex') }).eq('id', bookId);
  revalidatePath(`/dashboard/${bookId}`);
}

export async function signOutAndLeave() {
  await endSession();
  redirect('/login');
}
