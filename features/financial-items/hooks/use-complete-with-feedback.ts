import { useCallback } from 'react';

import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';
import { triggerCompletionHaptic } from '@/lib/haptics';

export type CompletionRequest = () => boolean;
export type CompletionFeedbackRequest = () => Promise<boolean>;

export function completeWithFeedback(
  complete: CompletionRequest,
  requestFeedback: CompletionFeedbackRequest = triggerCompletionHaptic,
): boolean {
  const didComplete = complete();
  if (didComplete) void requestFeedback();
  return didComplete;
}

export function useCompleteWithFeedback(): (id: string) => boolean {
  const { completeItem } = useFinancialItems();

  return useCallback(
    (id: string) => completeWithFeedback(() => completeItem(id)),
    [completeItem],
  );
}
