import { View } from 'react-native';

import { AppIdentity } from '@/components/app-identity';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageHeading } from '@/components/page-heading';
import { Screen } from '@/components/screen';
import type { FinancialItemsInitializationState } from '@/features/financial-items/hooks/use-financial-items';

interface InitializationScreenProps {
  initialization: FinancialItemsInitializationState;
  onRetry: () => void;
}

const loadingMessages = {
  authenticating: 'Starting your private Connected session…',
  seeding: 'Preparing your starter tasks…',
  loading: 'Loading your financial tasks…',
} as const;

const errorPresentations = {
  'configuration-error': {
    title: 'Connected mode needs setup',
    message:
      'The app connection settings are incomplete or unsafe. Check the documented public settings, then restart Clawback.',
    retryable: false,
  },
  'auth-error': {
    title: 'Could not start Connected mode',
    message:
      'We could not start a private session. Check your connection and try again.',
    retryable: true,
  },
  'seed-error': {
    title: 'Could not prepare starter tasks',
    message: 'Nothing was changed. Check your connection and try again.',
    retryable: true,
  },
  'read-error': {
    title: 'Could not load tasks',
    message: 'Check your connection and try again. Nothing was changed.',
    retryable: true,
  },
} as const;

function isErrorPhase(
  phase: FinancialItemsInitializationState['phase'],
): phase is keyof typeof errorPresentations {
  return phase in errorPresentations;
}

export function InitializationScreen({
  initialization,
  onRetry,
}: InitializationScreenProps) {
  const loadingMessage =
    initialization.phase === 'authenticating' ||
    initialization.phase === 'seeding' ||
    initialization.phase === 'loading'
      ? loadingMessages[initialization.phase]
      : null;
  const errorPresentation = isErrorPhase(initialization.phase)
    ? errorPresentations[initialization.phase]
    : null;

  if (!loadingMessage && !errorPresentation) return null;

  return (
    <Screen>
      <AppIdentity />
      <View className="mt-8">
        {loadingMessage ? (
          <>
            <PageHeading visuallyHidden>Clawback startup</PageHeading>
            <LoadingState message={loadingMessage} />
          </>
        ) : (
          <ErrorState
            message={errorPresentation?.message}
            onRetry={errorPresentation?.retryable ? onRetry : undefined}
            title={errorPresentation?.title}
          />
        )}
      </View>
    </Screen>
  );
}
