import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

import {
  createClient,
  processLock,
  type SupabaseClient,
} from '@supabase/supabase-js';

import type { SupabaseEnvironment } from '@/lib/supabase/environment';
import type { Database } from '@/types/database';

let client: SupabaseClient<Database> | null = null;
let clientConfiguration: string | null = null;

export function getSupabaseClient(
  environment: Extract<SupabaseEnvironment, { mode: 'connected' }>,
): SupabaseClient<Database> {
  const configuration = environment.url;
  if (client) {
    if (clientConfiguration !== configuration) {
      throw new Error(
        'The Supabase client was already initialized with another URL.',
      );
    }
    return client;
  }

  client = createClient<Database>(environment.url, environment.publishableKey, {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });
  clientConfiguration = configuration;
  return client;
}
