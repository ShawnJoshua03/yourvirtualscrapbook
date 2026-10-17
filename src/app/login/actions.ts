'use server';

import { headers } from 'next/headers';
import { supabaseForUser } from '@/lib/supabase/server';

export type LoginState = { sent?: string; error?: string };

/** Emails the organizer a one-time sign-in link that comes back to /auth/confirm. */
export async function sendSignInLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { error: 'That doesn’t look like an email address.' };
  const h = await headers();
  const origin = h.get('origin') ?? `https://${h.get('host')}`;
  const supabase = await supabaseForUser();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/confirm?next=/dashboard` } });
  if (error) {
    return { error: error.status === 429 ? 'Too many sign-in emails just now. Try again in a few minutes.' : 'Couldn’t send the link. Try again in a moment.' };
  }
  return { sent: email };
}

export async function signOut() {
  const supabase = await supabaseForUser();
  await supabase.auth.signOut();
}
