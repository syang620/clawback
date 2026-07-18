import type { SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform, type NativeEventSubscription } from 'react-native';

import type { Database } from '@/types/database';

interface AuthLifecycleState {
  client: SupabaseClient<Database> | null;
  consumers: number;
  subscription: NativeEventSubscription | null;
}

type GlobalWithAuthLifecycle = typeof globalThis & {
  __clawbackSupabaseAuthLifecycle?: AuthLifecycleState;
};

function getLifecycleState(): AuthLifecycleState {
  const globalState = globalThis as GlobalWithAuthLifecycle;
  globalState.__clawbackSupabaseAuthLifecycle ??= {
    client: null,
    consumers: 0,
    subscription: null,
  };
  return globalState.__clawbackSupabaseAuthLifecycle;
}

function disposeState(state: AuthLifecycleState): void {
  state.subscription?.remove();
  state.subscription = null;
  state.client?.auth.stopAutoRefresh();
  state.client = null;
  state.consumers = 0;
}

export function acquireSupabaseAuthLifecycle(
  client: SupabaseClient<Database>,
): () => void {
  if (Platform.OS === 'web') return () => undefined;

  const state = getLifecycleState();
  if (state.client && state.client !== client) disposeState(state);

  state.client = client;
  state.consumers += 1;

  if (!state.subscription) {
    if (AppState.currentState === 'active') client.auth.startAutoRefresh();
    else client.auth.stopAutoRefresh();

    state.subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    });
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;

    const currentState = getLifecycleState();
    if (currentState.client !== client) return;

    currentState.consumers = Math.max(0, currentState.consumers - 1);
    if (currentState.consumers === 0) disposeState(currentState);
  };
}

export function resetSupabaseAuthLifecycleForTests(): void {
  disposeState(getLifecycleState());
}
