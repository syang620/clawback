import { Linking, Pressable, Text, View } from 'react-native';

import { UrgencyBadge } from '@/features/financial-items/components/urgency-badge';
import { getDeadlinePresentation } from '@/features/financial-items/logic/urgency';
import { formatAbsoluteDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { getSafeHttpsUrl } from '@/lib/urls';
import type { FinancialItem } from '@/types/financial-item';

interface FinancialItemDetailProps {
  item: FinancialItem;
  onComplete: (id: string) => boolean;
  referenceDate: Date;
}

function titleCase(value: string): string {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

export function FinancialItemDetail({
  item,
  onComplete,
  referenceDate,
}: FinancialItemDetailProps) {
  const amount =
    item.kind === 'perk' ? item.valueCents : item.chargeAmountCents;
  const amountLabel = item.kind === 'perk' ? 'available' : 'at risk';
  const deadline = getDeadlinePresentation(item.dueAt, referenceDate);
  const safeActionUrl = getSafeHttpsUrl(item.actionUrl);

  return (
    <View className="mt-8 rounded-3xl border border-line bg-surface p-6">
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="rounded-full bg-canvas px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate">
          {titleCase(item.kind)}
        </Text>
        {item.status === 'active' ? (
          <UrgencyBadge presentation={deadline} />
        ) : (
          <Text className="rounded-full bg-teal-50 px-3 py-1 text-xs font-extrabold text-positive">
            {item.status === 'completed' ? 'Completed' : 'Expired'}
          </Text>
        )}
      </View>

      <Text className="mt-5 text-sm font-semibold text-slate">
        {item.provider ?? 'Provider not specified'}
      </Text>
      <Text className="mt-1 text-3xl font-black leading-9 text-ink">
        {item.title}
      </Text>

      <View className="mt-6 flex-row flex-wrap gap-8 border-y border-line py-5">
        <View>
          <Text className="text-xs font-bold uppercase tracking-wider text-slate">
            {amountLabel}
          </Text>
          <Text className="mt-1 text-3xl font-black text-ink">
            {formatMoney(amount)}
          </Text>
        </View>
        <View>
          <Text className="text-xs font-bold uppercase tracking-wider text-slate">
            Deadline
          </Text>
          <Text className="mt-1 font-extrabold text-ink">
            {formatAbsoluteDate(item.dueAt)}
          </Text>
          <Text className="mt-1 text-sm font-semibold text-slate">
            {deadline.relativeDeadlineLabel}
          </Text>
        </View>
      </View>

      <View className="mt-5 gap-2">
        <Text className="text-sm text-slate">
          Repeats: {titleCase(item.recurrence)}
        </Text>
        <Text className="text-sm text-slate">
          Source: {titleCase(item.source)} data
        </Text>
        {item.completedAt && (
          <Text className="text-sm text-slate">
            Completed: {formatAbsoluteDate(item.completedAt)}
          </Text>
        )}
      </View>

      <View className="mt-7 flex-row flex-wrap gap-3">
        {safeActionUrl && (
          <Pressable
            accessibilityHint={`Opens ${safeActionUrl.hostname} in your browser; Clawback does not take the financial action for you`}
            accessibilityLabel={`Open action page on ${safeActionUrl.hostname}`}
            accessibilityRole="link"
            className="min-h-11 justify-center rounded-xl border border-line px-4 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
            onPress={() => {
              void Linking.openURL(safeActionUrl.href).catch(() => undefined);
            }}
          >
            <Text className="font-extrabold text-ink">Open action page</Text>
            <Text className="mt-0.5 text-xs text-slate">
              {safeActionUrl.hostname}
            </Text>
          </Pressable>
        )}
        {item.status === 'active' && (
          <Pressable
            accessibilityHint="Records that you completed this task yourself"
            accessibilityLabel={`Complete ${item.title}`}
            accessibilityRole="button"
            className="min-h-11 justify-center rounded-xl bg-ink px-5 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
            onPress={() => onComplete(item.id)}
          >
            <Text className="font-extrabold text-white">Complete</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
