import { usePathname } from 'expo-router';

import { Dashboard } from '@/features/financial-items/components/dashboard';
import { useCompleteWithFeedback } from '@/features/financial-items/hooks/use-complete-with-feedback';
import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';

export default function DashboardRoute() {
  const {
    dismissMutationError,
    isPristineDemoState,
    items,
    mutationErrors,
    pendingItemOperations,
  } = useFinancialItems();
  const completeItem = useCompleteWithFeedback();
  const isRouteFocused = usePathname() === '/';

  return (
    <Dashboard
      isRouteFocused={isRouteFocused}
      items={items}
      mutationErrors={mutationErrors}
      onComplete={completeItem}
      onDismissError={dismissMutationError}
      pendingItemOperations={pendingItemOperations}
      referenceDate={new Date()}
      showPristineIntro={isPristineDemoState}
    />
  );
}
