import { useCallback } from 'react';

import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';
import { triggerCompletionHaptic } from '@/lib/haptics';

export type CompletionRequest = () => Promise<boolean>;
export type CompletionFeedbackRequest = () => Promise<boolean>;

export async function completeWithFeedback(
  complete: CompletionRequest,
  requestFeedback: CompletionFeedbackRequest = triggerCompletionHaptic,
): Promise<boolean> {
  const didComplete = await complete();
  if (didComplete) void requestFeedback();
  return didComplete;
}

export function useCompleteWithFeedback(): (id: string) => Promise<boolean> {
  const { completeItem } = useFinancialItems();

  return useCallback(
    (id: string) => completeWithFeedback(() => completeItem(id)),
    [completeItem],
  );
}
