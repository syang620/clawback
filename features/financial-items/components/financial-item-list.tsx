import { View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { SwipeToStrike } from '@/features/financial-items/components/swipe-to-strike';
import { findNextDueItem } from '@/features/financial-items/logic/dashboard';
import { rankFinancialItems } from '@/features/financial-items/logic/urgency';
import type { FinancialItem } from '@/types/financial-item';

import { FinancialItemCard } from './financial-item-card';

interface FinancialItemListProps {
  isRouteFocused?: boolean;
  items: FinancialItem[];
  onComplete: (id: string) => boolean;
  referenceDate: Date;
}

export function FinancialItemList({
  isRouteFocused = true,
  items,
  onComplete,
  referenceDate,
}: FinancialItemListProps) {
  const rankedItems = rankFinancialItems(items, referenceDate);
  if (rankedItems.length === 0) return <EmptyState />;

  const nextDueItem = findNextDueItem(rankedItems);

  return (
    <View className="gap-4">
      {rankedItems.map((item) => (
        <SwipeToStrike
          isRouteFocused={isRouteFocused}
          key={item.id}
          itemId={item.id}
          onComplete={onComplete}
        >
          {(completeItem) => (
            <FinancialItemCard
              item={item}
              isNextDue={item.id === nextDueItem?.id}
              onComplete={completeItem}
              referenceDate={referenceDate}
            />
          )}
        </SwipeToStrike>
      ))}
    </View>
  );
}
