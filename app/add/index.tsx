import { type Href, useRouter } from 'expo-router';

import { AppHeader } from '@/components/app-header';
import { Screen } from '@/components/screen';
import { AddMenu } from '@/features/financial-items/components/add-menu';

export default function AddRoute() {
  const router = useRouter();

  return (
    <Screen>
      <AppHeader />
      <AddMenu
        onCancel={() => router.replace('/')}
        onSelect={(kind) => router.push(`/add/manual?kind=${kind}` as Href)}
      />
    </Screen>
  );
}
