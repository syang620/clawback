import { View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { findNextDueItem } from '@/features/financial-items/logic/dashboard';
import type { FinancialItem } from '@/types/financial-item';

import { FinancialItemCard } from './financial-item-card';

interface FinancialItemListProps {
  items: FinancialItem[];
}

export function FinancialItemList({ items }: FinancialItemListProps) {
  if (items.length === 0) return <EmptyState />;

  const nextDueItem = findNextDueItem(items);

  return (
    <View className="gap-4">
      {items.map((item) => (
        <FinancialItemCard
          key={item.id}
          item={item}
          isNextDue={item.id === nextDueItem?.id}
        />
      ))}
    </View>
  );
}
