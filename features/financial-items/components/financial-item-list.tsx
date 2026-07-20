import { View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { SwipeToStrike } from '@/features/financial-items/components/swipe-to-strike';
import {
  findEarliestActiveDeadline,
  getActiveDeadlineCalendarDate,
} from '@/features/financial-items/logic/dashboard';
import { rankFinancialItems } from '@/features/financial-items/logic/urgency';
import type {
  FinancialItemsMutationError,
  FinancialItemPendingOperation,
} from '@/features/financial-items/hooks/use-financial-items';
import type { FinancialItem } from '@/types/financial-item';

import { FinancialItemCard } from './financial-item-card';

interface FinancialItemListProps {
  isRouteFocused?: boolean;
  items: FinancialItem[];
  mutationErrors?: FinancialItemsMutationError[];
  onComplete: (id: string) => Promise<boolean>;
  onDismissError?: (errorId: string) => void;
  pendingItemOperations?: Readonly<
    Record<string, FinancialItemPendingOperation>
  >;
  referenceDate: Date;
}

export function FinancialItemList({
  isRouteFocused = true,
  items,
  mutationErrors = [],
  onComplete,
  onDismissError,
  pendingItemOperations = {},
  referenceDate,
}: FinancialItemListProps) {
  const rankedItems = rankFinancialItems(items, referenceDate);
  if (rankedItems.length === 0) {
    return (
      <EmptyState
        showActivityLink={items.some(
          (item) => item.status === 'completed' || item.status === 'expired',
        )}
      />
    );
  }

  const earliestActiveDeadline = findEarliestActiveDeadline(items);

  return (
    <View className="gap-4">
      {rankedItems.map((item) => (
        <SwipeToStrike
          disabled={pendingItemOperations[item.id] !== undefined}
          isRouteFocused={isRouteFocused}
          key={item.id}
          itemId={item.id}
          onComplete={onComplete}
        >
          {(completeItem) => (
            <FinancialItemCard
              item={item}
              isCompleting={pendingItemOperations[item.id] === 'complete'}
              isNextDue={
                earliestActiveDeadline !== null &&
                getActiveDeadlineCalendarDate(item) === earliestActiveDeadline
              }
              mutationError={mutationErrors.find(
                (error) =>
                  error.operation === 'complete' && error.itemId === item.id,
              )}
              onComplete={completeItem}
              onDismissError={onDismissError}
              referenceDate={referenceDate}
            />
          )}
        </SwipeToStrike>
      ))}
    </View>
  );
}
