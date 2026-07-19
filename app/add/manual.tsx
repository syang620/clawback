import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppHeader } from '@/components/app-header';
import { Screen } from '@/components/screen';
import { ManualFinancialItemForm } from '@/features/financial-items/components/manual-financial-item-form';
import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';
import { isFinancialItemKind } from '@/features/financial-items/logic/manual-entry';

export default function ManualFinancialItemRoute() {
  const { kind } = useLocalSearchParams<{ kind?: string | string[] }>();
  const router = useRouter();
  const { createItem, dismissMutationError, mutationErrors } =
    useFinancialItems();
  const kindValue = Array.isArray(kind) ? kind[0] : kind;
  const initialKind = isFinancialItemKind(kindValue) ? kindValue : null;
  const createError = mutationErrors.find(
    (error) => error.operation === 'create',
  );

  return (
    <Screen keyboardAware>
      <AppHeader />
      <ManualFinancialItemForm
        initialKind={initialKind}
        onCancel={() => router.replace('/')}
        onDismissSaveError={
          createError ? () => dismissMutationError(createError.id) : undefined
        }
        onSave={async (input) => {
          const createdItem = await createItem(input);
          if (!createdItem) return false;
          router.replace('/');
          return true;
        }}
        saveError={createError}
      />
    </Screen>
  );
}
