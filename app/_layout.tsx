import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { UndoBanner } from '@/components/undo-banner';
import { FinancialItemsProvider } from '@/features/financial-items/hooks/use-financial-items';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FinancialItemsProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
        <UndoBanner />
      </FinancialItemsProvider>
    </GestureHandlerRootView>
  );
}
