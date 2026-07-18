import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppHeader } from '@/components/app-header';
import { Screen } from '@/components/screen';
import { ManualFinancialItemForm } from '@/features/financial-items/components/manual-financial-item-form';
import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';
import { isFinancialItemKind } from '@/features/financial-items/logic/manual-entry';

export default function ManualFinancialItemRoute() {
  const { kind } = useLocalSearchParams<{ kind?: string | string[] }>();
  const router = useRouter();
  const { createItem } = useFinancialItems();
  const kindValue = Array.isArray(kind) ? kind[0] : kind;
  const initialKind = isFinancialItemKind(kindValue) ? kindValue : null;

  return (
    <Screen keyboardAware>
      <AppHeader />
      <ManualFinancialItemForm
        initialKind={initialKind}
        onCancel={() => router.replace('/')}
        onSave={(input) => {
          createItem(input);
          router.replace('/');
        }}
      />
    </Screen>
  );
}
