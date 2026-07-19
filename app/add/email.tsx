import { useMemo } from 'react';
import { useIsFocused, useRouter } from 'expo-router';

import { AppHeader } from '@/components/app-header';
import { Screen } from '@/components/screen';
import {
  EmailExtractionUnavailable,
  EmailExtractionWorkflow,
} from '@/features/email-parser/components/email-extraction-workflow';
import { useEmailExtractionWorkflow } from '@/features/email-parser/use-email-extraction-workflow';
import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';
import { createDefaultFinancialEmailParser } from '@/services/email-parser/service';

export default function EmailExtractionRoute() {
  const router = useRouter();
  const { mode } = useFinancialItems();

  if (mode !== 'connected') {
    return (
      <Screen>
        <AppHeader />
        <EmailExtractionUnavailable onBack={() => router.replace('/add')} />
      </Screen>
    );
  }

  return <ConnectedEmailExtractionRoute />;
}

function ConnectedEmailExtractionRoute() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { createItem, dismissMutationError, mutationErrors } =
    useFinancialItems();
  const createError = mutationErrors.find(
    (error) => error.operation === 'create',
  );
  const parser = useMemo(() => createDefaultFinancialEmailParser(), []);
  const workflow = useEmailExtractionWorkflow({
    createItem,
    isFocused,
    parser,
  });
  const dismissCreateError = () => {
    if (createError) dismissMutationError(createError.id);
  };

  return (
    <Screen keyboardAware>
      <AppHeader />
      <EmailExtractionWorkflow
        onCancel={() => {
          dismissCreateError();
          router.replace('/');
        }}
        onManualFallback={() => {
          dismissCreateError();
          router.replace('/add');
        }}
        onSaved={() => router.replace('/')}
        workflow={workflow}
      />
    </Screen>
  );
}
