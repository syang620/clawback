import { Stack, useIsFocused } from 'expo-router';

import { Activity } from '@/features/financial-items/components/activity';
import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';

export default function ActivityRoute() {
  const { items } = useFinancialItems();
  const isRouteFocused = useIsFocused();
  return (
    <>
      <Stack.Screen options={{ title: 'Activity | Clawback' }} />
      <Activity isRouteFocused={isRouteFocused} items={items} />
    </>
  );
}
