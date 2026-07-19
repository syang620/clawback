import { type Href, useRouter } from 'expo-router';

import { AppHeader } from '@/components/app-header';
import { Screen } from '@/components/screen';
import { AddMenu } from '@/features/financial-items/components/add-menu';
import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';

export default function AddRoute() {
  const router = useRouter();
  const { mode } = useFinancialItems();

  return (
    <Screen>
      <AppHeader />
      <AddMenu
        mode={mode ?? 'demo'}
        onCancel={() => router.replace('/')}
        onExtractEmail={() => router.push('/add/email' as Href)}
        onSelect={(kind) => router.push(`/add/manual?kind=${kind}` as Href)}
      />
    </Screen>
  );
}
