import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Screen } from '@/components/screen';
import { UndoBanner } from '@/components/undo-banner';
import {
  FinancialItemsProvider,
  useFinancialItems,
} from '@/features/financial-items/hooks/use-financial-items';

function FinancialItemsApplication() {
  const { initialization, retryInitialization } = useFinancialItems();

  if (initialization.phase === 'authenticating') {
    return (
      <Screen>
        <LoadingState message="Creating a secure anonymous session…" />
      </Screen>
    );
  }

  if (initialization.phase === 'seeding') {
    return (
      <Screen>
        <LoadingState message="Preparing your initial financial tasks…" />
      </Screen>
    );
  }

  if (initialization.phase === 'loading') {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (initialization.phase !== 'ready') {
    const isConfigurationError = initialization.phase === 'configuration-error';
    return (
      <Screen>
        <ErrorState
          message={initialization.message}
          onRetry={isConfigurationError ? undefined : retryInitialization}
          title={
            isConfigurationError
              ? 'Supabase configuration needs attention'
              : initialization.phase === 'auth-error'
                ? 'Could not start a secure session'
                : initialization.phase === 'seed-error'
                  ? 'Could not prepare tasks'
                  : 'Could not load tasks'
          }
        />
      </Screen>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <UndoBanner />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FinancialItemsProvider>
        <StatusBar style="dark" />
        <FinancialItemsApplication />
      </FinancialItemsProvider>
    </GestureHandlerRootView>
  );
}
