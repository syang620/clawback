import { type Href, useRouter } from 'expo-router';

import { AppHeader } from '@/components/app-header';
import { Screen } from '@/components/screen';
import { AddMenu } from '@/features/financial-items/components/add-menu';
import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';

export default function AddRoute() {
  const router = useRouter();
  const {
    initialization,
    isCreating,
    isResettingLocalDemo,
    mode,
    pendingItemOperations,
    resetLocalDemo,
  } = useFinancialItems();
  const isLocalDemoResetBlocked =
    initialization.phase !== 'ready' ||
    isCreating ||
    isResettingLocalDemo ||
    Object.keys(pendingItemOperations).length > 0;

  return (
    <Screen>
      <AppHeader />
      <AddMenu
        isResettingLocalDemo={isResettingLocalDemo}
        isLocalDemoResetBlocked={isLocalDemoResetBlocked}
        mode={mode ?? 'demo'}
        onCancel={() => router.replace('/')}
        onExtractEmail={() => router.push('/add/email' as Href)}
        onResetLocalDemo={async () => {
          const didReset = await resetLocalDemo();
          if (didReset) router.replace('/');
          return didReset;
        }}
        onSelect={(kind) => router.push(`/add/manual?kind=${kind}` as Href)}
      />
    </Screen>
  );
}
