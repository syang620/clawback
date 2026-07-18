import { resolveSupabaseEnvironment } from '@/lib/supabase/environment';

describe('Checkpoint 4A Supabase environment', () => {
  it('uses demo mode only when both values are absent', () => {
    expect(resolveSupabaseEnvironment({})).toEqual({ mode: 'demo' });
    expect(
      resolveSupabaseEnvironment({ url: '', publishableKey: '  ' }),
    ).toEqual({ mode: 'demo' });
  });

  it.each([
    [{ url: 'https://example.supabase.co' }],
    [{ publishableKey: 'sb_publishable_example' }],
  ])('rejects partial configuration', (input) => {
    expect(resolveSupabaseEnvironment(input)).toMatchObject({ mode: 'error' });
  });

  it.each([
    'not a URL',
    'ftp://example.supabase.co',
    'http://example.supabase.co',
  ])('rejects malformed or unsafe remote URL %j', (url) => {
    expect(
      resolveSupabaseEnvironment({
        url,
        publishableKey: 'sb_publishable_example',
      }),
    ).toMatchObject({ mode: 'error' });
  });

  it('accepts HTTPS and local HTTP without classifying legacy public keys', () => {
    expect(
      resolveSupabaseEnvironment({
        url: 'https://project.supabase.co',
        publishableKey: 'legacy-public-key-shape',
      }),
    ).toEqual({
      mode: 'connected',
      url: 'https://project.supabase.co',
      publishableKey: 'legacy-public-key-shape',
    });
    expect(
      resolveSupabaseEnvironment({
        url: 'http://127.0.0.1:54321',
        publishableKey: 'local-public-key',
      }),
    ).toMatchObject({ mode: 'connected' });
  });

  it('rejects an obvious secret prefix without reflecting the key', () => {
    const secret = 'sb_secret_do-not-repeat';
    const result = resolveSupabaseEnvironment({
      url: 'https://project.supabase.co',
      publishableKey: secret,
    });

    expect(result).toMatchObject({ mode: 'error' });
    if (result.mode === 'error') expect(result.message).not.toContain(secret);
  });
});
