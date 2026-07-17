import { Text, View } from 'react-native';

import { formatAbsoluteDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import type { FinancialItem } from '@/types/financial-item';

interface FinancialItemCardProps {
  item: FinancialItem;
  isNextDue: boolean;
}

const kindLabels = {
  trial: 'Trial',
  perk: 'Perk',
  subscription: 'Subscription',
} as const;

function formatRecurrence(item: FinancialItem): string {
  if (item.recurrence === 'none') return 'One time';
  return `${item.recurrence[0].toUpperCase()}${item.recurrence.slice(1)}`;
}

export function FinancialItemCard({ item, isNextDue }: FinancialItemCardProps) {
  const isPerk = item.kind === 'perk';
  const amount = isPerk ? item.valueCents : item.chargeAmountCents;
  const amountLabel = isPerk ? 'available' : 'at risk';

  return (
    <View
      className={`rounded-3xl border bg-surface p-5 ${
        isNextDue ? 'border-attention shadow-sm' : 'border-line'
      }`}
    >
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="rounded-full bg-canvas px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate">
          {kindLabels[item.kind]}
        </Text>
        {isNextDue && (
          <Text className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-attention">
            Next deadline
          </Text>
        )}
      </View>

      <View className="mt-4 flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-slate">
            {item.provider ?? 'Provider not specified'}
          </Text>
          <Text className="mt-1 text-xl font-extrabold leading-7 text-ink">
            {item.title}
          </Text>
        </View>
        <View className="items-end">
          <Text
            className={`text-2xl font-black ${isPerk ? 'text-brand' : 'text-risk'}`}
          >
            {formatMoney(amount)}
          </Text>
          <Text className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate">
            {amountLabel}
          </Text>
        </View>
      </View>

      <View className="mt-5 flex-row flex-wrap justify-between gap-3 border-t border-line pt-4">
        <View>
          <Text className="text-xs font-bold uppercase tracking-wider text-slate">
            Deadline
          </Text>
          <Text className="mt-1 font-bold text-ink">
            {formatAbsoluteDate(item.dueAt)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate">
            Repeats
          </Text>
          <Text className="mt-1 font-bold text-ink">
            {formatRecurrence(item)}
          </Text>
        </View>
      </View>
    </View>
  );
}
