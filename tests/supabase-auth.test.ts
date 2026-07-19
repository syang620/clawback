import type { Session, SupabaseClient } from '@supabase/supabase-js';

import {
  getOrCreateAnonymousSession,
  SupabaseAuthenticationError,
} from '@/services/supabase-auth';
import type { Database } from '@/types/database';

const session = { user: { id: 'user-a' } } as unknown as Session;

function clientWithAuth(auth: object): SupabaseClient<Database> {
  return { auth } as unknown as SupabaseClient<Database>;
}

describe('Checkpoint 4A anonymous session lifecycle', () => {
  it('restores an existing session without creating another user', async () => {
    const auth = {
      getSession: jest.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
      signInAnonymously: jest.fn(),
    };

    await expect(
      getOrCreateAnonymousSession(clientWithAuth(auth)),
    ).resolves.toBe(session);
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('creates an anonymous session only when none is stored', async () => {
    const auth = {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      signInAnonymously: jest.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
    };

    await expect(
      getOrCreateAnonymousSession(clientWithAuth(auth)),
    ).resolves.toBe(session);
    expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('reuses the session created by a prior retry instead of creating another user', async () => {
    const auth = {
      getSession: jest
        .fn()
        .mockResolvedValueOnce({ data: { session: null }, error: null })
        .mockResolvedValueOnce({ data: { session }, error: null }),
      signInAnonymously: jest.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
    };
    const client = clientWithAuth(auth);

    await expect(getOrCreateAnonymousSession(client)).resolves.toBe(session);
    await expect(getOrCreateAnonymousSession(client)).resolves.toBe(session);
    expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('normalizes restore and anonymous sign-in failures', async () => {
    const restoreFailure = clientWithAuth({
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: new Error('private details'),
      }),
    });
    await expect(
      getOrCreateAnonymousSession(restoreFailure),
    ).rejects.toBeInstanceOf(SupabaseAuthenticationError);

    const signInFailure = clientWithAuth({
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      signInAnonymously: jest.fn().mockResolvedValue({
        data: { session: null },
        error: new Error('private details'),
      }),
    });
    await expect(
      getOrCreateAnonymousSession(signInFailure),
    ).rejects.toBeInstanceOf(SupabaseAuthenticationError);
  });
});
