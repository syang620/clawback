import type { SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import {
  acquireSupabaseAuthLifecycle,
  resetSupabaseAuthLifecycleForTests,
} from '@/lib/supabase/auth-lifecycle';
import type { Database } from '@/types/database';

function createClient() {
  const auth = {
    startAutoRefresh: jest.fn(),
    stopAutoRefresh: jest.fn(),
  };
  return {
    auth,
    client: { auth } as unknown as SupabaseClient<Database>,
  };
}

describe('Checkpoint 4A native Auth refresh lifecycle', () => {
  const originalPlatform = Platform.OS;
  const originalAppState = AppState.currentState;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    resetSupabaseAuthLifecycleForTests();
    jest.restoreAllMocks();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatform,
    });
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: originalAppState,
    });
  });

  it('registers once across remount consumers and cleans up after the last release', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: 'active',
    });
    const remove = jest.fn();
    const listeners: Array<(state: 'active' | 'background') => void> = [];
    const addEventListener = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, callback) => {
        listeners.push(callback as (state: 'active' | 'background') => void);
        return { remove };
      });
    const { auth, client } = createClient();

    const releaseFirst = acquireSupabaseAuthLifecycle(client);
    const releaseSecond = acquireSupabaseAuthLifecycle(client);

    expect(addEventListener).toHaveBeenCalledTimes(1);
    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(1);
    listeners[0]?.('background');
    listeners[0]?.('active');
    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(2);

    releaseFirst();
    expect(remove).not.toHaveBeenCalled();
    releaseFirst();
    expect(remove).not.toHaveBeenCalled();
    releaseSecond();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(2);
  });

  it('does not register an AppState listener on web', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const addEventListener = jest.spyOn(AppState, 'addEventListener');
    const { auth, client } = createClient();

    expect(Platform.OS).toBe('web');
    acquireSupabaseAuthLifecycle(client)();

    expect(addEventListener).not.toHaveBeenCalled();
    expect(auth.startAutoRefresh).not.toHaveBeenCalled();
    expect(auth.stopAutoRefresh).not.toHaveBeenCalled();
  });
});
