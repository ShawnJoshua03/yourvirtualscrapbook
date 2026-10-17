/* Where the email sign-in link lands. Handles both link styles Supabase can send: a PKCE `code`, or a
   `token_hash` from a customised email template. Then sends the organizer on to their dashboard. */
import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabaseForUser } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = url.searchParams.get('next');
  const target = next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'; // never redirect off-site
  const supabase = await supabaseForUser();

  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error('missing code') };

  return NextResponse.redirect(new URL(error ? '/login?error=link' : target, url.origin));
}
