import { type Href, Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { UrgencyBadge } from '@/features/financial-items/components/urgency-badge';
import { getDeadlinePresentation } from '@/features/financial-items/logic/urgency';
import { formatAbsoluteDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import type { FinancialItem } from '@/types/financial-item';

interface FinancialItemCardProps {
  item: FinancialItem;
  isNextDue: boolean;
  onComplete: (id: string) => boolean;
  referenceDate: Date;
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

export function FinancialItemCard({
  item,
  isNextDue,
  onComplete,
  referenceDate,
}: FinancialItemCardProps) {
  const isPerk = item.kind === 'perk';
  const amount = isPerk ? item.valueCents : item.chargeAmountCents;
  const amountLabel = isPerk ? 'available' : 'at risk';
  const deadline = getDeadlinePresentation(item.dueAt, referenceDate);
  // Initialize NativeWind's shadow variables before next-due status can change.
  const shadowClassName = isNextDue ? 'shadow-sm' : 'shadow-none';

  return (
    <View
      className={`rounded-3xl border bg-surface p-5 ${
        isNextDue ? 'border-attention' : 'border-line'
      } ${shadowClassName}`}
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
        <UrgencyBadge presentation={deadline} />
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
          <Text className="mt-1 text-sm font-semibold text-slate">
            {deadline.relativeDeadlineLabel}
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

      <View className="mt-5 flex-row flex-wrap justify-end gap-3">
        <Link href={`/item/${encodeURIComponent(item.id)}` as Href} asChild>
          <Pressable
            accessibilityLabel={`View details for ${item.title}`}
            accessibilityRole="link"
            className="min-h-11 justify-center rounded-xl border border-line bg-surface px-4 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
          >
            <Text className="font-extrabold text-ink">View details</Text>
          </Pressable>
        </Link>
        <Pressable
          accessibilityHint="Moves this task to Activity and updates dashboard totals"
          accessibilityLabel={`Complete ${item.title}`}
          accessibilityRole="button"
          className="min-h-11 justify-center rounded-xl bg-ink px-5 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
          onPress={() => onComplete(item.id)}
        >
          <Text className="font-extrabold text-white">Complete</Text>
        </Pressable>
      </View>
    </View>
  );
}
