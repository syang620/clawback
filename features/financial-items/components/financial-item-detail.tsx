import { Pressable, Text, View } from 'react-native';

import { MutationError } from '@/components/mutation-error';
import { ExternalAction } from '@/features/financial-items/components/external-action';
import { UrgencyBadge } from '@/features/financial-items/components/urgency-badge';
import { getDeadlinePresentation } from '@/features/financial-items/logic/urgency';
import { formatAbsoluteDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { getSafeHttpsUrl } from '@/lib/urls';
import type { FinancialItem } from '@/types/financial-item';

interface FinancialItemDetailProps {
  item: FinancialItem;
  isCompleting?: boolean;
  mutationError?: { id: string; message: string };
  onComplete: (id: string) => Promise<boolean>;
  onDismissError?: (errorId: string) => void;
  referenceDate: Date;
}

function titleCase(value: string): string {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

export function FinancialItemDetail({
  item,
  isCompleting = false,
  mutationError,
  onComplete,
  onDismissError,
  referenceDate,
}: FinancialItemDetailProps) {
  const amount =
    item.kind === 'perk' ? item.valueCents : item.chargeAmountCents;
  const amountLabel = item.kind === 'perk' ? 'available' : 'at risk';
  const deadline = getDeadlinePresentation(item.dueAt, referenceDate);
  const hasSafeActionUrl = Boolean(getSafeHttpsUrl(item.actionUrl));

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

      <View
        className={hasSafeActionUrl ? 'mt-7 border-t border-line pt-6' : 'mt-7'}
      >
        {hasSafeActionUrl && (
          <>
            <Text
              accessibilityRole="header"
              className="text-lg font-black text-ink"
            >
              Next action
            </Text>
            {item.status === 'active' && (
              <Text className="mt-1 text-sm leading-5 text-slate">
                Open the provider’s website, then mark this task complete.
              </Text>
            )}
          </>
        )}
        <View
          accessibilityLabel="Next action controls"
          className={`${hasSafeActionUrl ? 'mt-4' : ''} gap-4 md:flex-row md:items-start`}
        >
          <ExternalAction actionUrl={item.actionUrl} provider={item.provider} />
          {item.status === 'active' && (
            <Pressable
              accessibilityHint="Records that you completed this task yourself"
              accessibilityLabel={`Complete ${item.title}`}
              accessibilityRole="button"
              accessibilityState={{
                busy: isCompleting,
                disabled: isCompleting,
              }}
              className="min-h-11 w-full items-center justify-center rounded-xl bg-ink px-5 py-3 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand md:w-auto"
              disabled={isCompleting}
              onPress={() => {
                void onComplete(item.id);
              }}
            >
              <Text className="font-extrabold text-white">
                {isCompleting ? 'Completing…' : 'Complete'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
      {mutationError && onDismissError && (
        <MutationError
          message={mutationError.message}
          onDismiss={() => onDismissError(mutationError.id)}
        />
      )}
    </View>
  );
}
