import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AccessibilityFocusProvider } from '@/components/accessibility-focus';
import { InitializationScreen } from '@/components/initialization-screen';
import { UndoBanner } from '@/components/undo-banner';
import {
  FinancialItemsProvider,
  useFinancialItems,
} from '@/features/financial-items/hooks/use-financial-items';

function FinancialItemsApplication() {
  const { initialization, retryInitialization } = useFinancialItems();

  if (initialization.phase !== 'ready') {
    return (
      <InitializationScreen
        initialization={initialization}
        onRetry={retryInitialization}
      />
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
      <AccessibilityFocusProvider>
        <FinancialItemsProvider>
          <StatusBar style="dark" />
          <FinancialItemsApplication />
        </FinancialItemsProvider>
      </AccessibilityFocusProvider>
    </GestureHandlerRootView>
  );
}
