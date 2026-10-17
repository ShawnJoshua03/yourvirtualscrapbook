import 'server-only';
import { supabaseAdmin } from './supabase/server';
import { isUuid } from './books';

export const MAX_MEDIA = 40;
const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' };
export const allowedMime = (t: unknown): t is string => typeof t === 'string' && t in MIME_EXT;
export const extFor = (mime: string) => MIME_EXT[mime];

/** The book an invite token opens, only while it's still collecting. Contributors get nothing else. */
export async function collectingBook(token: string) {
  if (!/^[a-f0-9]{24}$/.test(token)) return null;
  const { data } = await supabaseAdmin().from('books').select('id, status').eq('invite_token', token).maybeSingle();
  return data?.status === 'collecting' ? data : null;
}

export const contributionPrefix = (bookId: string, contributionId: string) => `${bookId}/${contributionId}/`;

export async function contributionExists(contributionId: string) {
  const { data } = await supabaseAdmin().from('contributions').select('id').eq('id', contributionId).maybeSingle();
  return !!data;
}

export { isUuid };
