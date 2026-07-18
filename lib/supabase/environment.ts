export type SupabaseEnvironment =
  | { mode: 'demo' }
  | { mode: 'error'; message: string }
  | { mode: 'connected'; publishableKey: string; url: string };

interface SupabaseEnvironmentInput {
  publishableKey?: string;
  url?: string;
}

function isAllowedSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:') return true;

    return (
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname === '[::1]')
    );
  } catch {
    return false;
  }
}

export function resolveSupabaseEnvironment(
  input: SupabaseEnvironmentInput = {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
): SupabaseEnvironment {
  const url = input.url?.trim() ?? '';
  const publishableKey = input.publishableKey?.trim() ?? '';

  if (!url && !publishableKey) return { mode: 'demo' };

  if (!url || !publishableKey) {
    return {
      mode: 'error',
      message:
        'Supabase configuration is incomplete. Set both public variables or remove both to use demo mode.',
    };
  }

  if (!isAllowedSupabaseUrl(url)) {
    return {
      mode: 'error',
      message: 'The configured Supabase URL is not valid.',
    };
  }

  if (publishableKey.toLowerCase().startsWith('sb_secret_')) {
    return {
      mode: 'error',
      message:
        'A private Supabase key cannot be used by the application. Configure a publishable key instead.',
    };
  }

  return { mode: 'connected', publishableKey, url };
}
