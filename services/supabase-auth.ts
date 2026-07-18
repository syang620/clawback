import type { Session, SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

export class SupabaseAuthenticationError extends Error {
  constructor(options?: { cause?: unknown }) {
    super('Could not create or restore the Supabase session.', options);
    this.name = 'SupabaseAuthenticationError';
  }
}

export async function getOrCreateAnonymousSession(
  client: SupabaseClient<Database>,
): Promise<Session> {
  const { data: sessionData, error: sessionError } =
    await client.auth.getSession();
  if (sessionError) {
    throw new SupabaseAuthenticationError({ cause: sessionError });
  }
  if (sessionData.session) return sessionData.session;

  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.session) {
    throw new SupabaseAuthenticationError({ cause: error });
  }
  return data.session;
}
