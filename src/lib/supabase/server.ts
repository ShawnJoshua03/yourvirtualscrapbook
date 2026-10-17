import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = () => process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** Acts as the signed-in organizer, so row-level security decides what they can see and change. */
export async function supabaseForUser() {
  const store = await cookies();
  return createServerClient(url(), publishableKey(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll(toSet) {
        // Server Components can't set cookies; the proxy refreshes the session before they run, so ignoring is safe
        try { toSet.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {}
      },
    },
  });
}

/**
 * Bypasses row-level security. Only for server code that has already checked access another way:
 * a contributor's invite token, or a published book's slug. Never expose this to the browser.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SECRET_KEY is not set');
  return createClient(url(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const publicMediaUrl = (path: string) => `${url()}/storage/v1/object/public/media/${path}`;
