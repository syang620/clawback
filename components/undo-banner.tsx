import { Pressable, Text, View } from 'react-native';

import { MutationError } from '@/components/mutation-error';
import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';
import { formatMoney } from '@/lib/money';

export function UndoBanner() {
  const {
    dismissMutationError,
    lastCompletion,
    mutationErrors,
    pendingItemOperations,
    undoLastCompletion,
  } = useFinancialItems();
  if (!lastCompletion) return null;

  const { item } = lastCompletion;
  const amount =
    item.kind === 'perk' ? item.valueCents : item.chargeAmountCents;
  const message =
    item.kind === 'perk'
      ? `Struck. ${formatMoney(amount)} moved to your clawed-back total.`
      : `Struck. You protected ${formatMoney(amount)} from a potential charge.`;
  const isRestoring = pendingItemOperations[item.id] === 'restore';
  const restoreError = mutationErrors.find(
    (error) => error.operation === 'restore' && error.itemId === item.id,
  );

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="absolute inset-x-4 bottom-5 z-50 mx-auto max-w-xl rounded-2xl bg-ink px-4 py-3 shadow-lg"
    >
      <View className="flex-row items-center gap-3">
        <Text className="min-w-0 flex-1 text-sm font-semibold leading-5 text-white">
          {message}
        </Text>
        <Pressable
          accessibilityHint={`Restores ${item.title} to active tasks`}
          accessibilityLabel={`Undo completion of ${item.title}`}
          accessibilityRole="button"
          accessibilityState={{ busy: isRestoring, disabled: isRestoring }}
          className="min-h-11 justify-center rounded-xl bg-white px-4 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-white"
          disabled={isRestoring}
          onPress={() => {
            void undoLastCompletion();
          }}
        >
          <Text className="font-extrabold text-ink">
            {isRestoring ? 'Restoring…' : 'Undo'}
          </Text>
        </Pressable>
      </View>
      {restoreError && (
        <MutationError
          message={restoreError.message}
          onDismiss={() => dismissMutationError(restoreError.id)}
        />
      )}
    </View>
  );
}
