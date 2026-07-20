import { useEffect, useRef } from 'react';
import { Pressable, Text, type View as ViewType, View } from 'react-native';

import {
  focusAccessibilityTarget,
  useAccessibilityFocus,
} from '@/components/accessibility-focus';
import { MutationError } from '@/components/mutation-error';
import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';
import { formatMoney } from '@/lib/money';

export function UndoBanner() {
  const { announce, focusCurrentPageHeading } = useAccessibilityFocus();
  const {
    dismissMutationError,
    dismissUndo,
    lastCompletion,
    mutationErrors,
    pendingItemOperations,
    undoLastCompletion,
  } = useFinancialItems();
  const undoButtonRef = useRef<ViewType>(null);
  const focusedCompletionTokenRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      lastCompletion &&
      focusedCompletionTokenRef.current !== lastCompletion.token
    ) {
      focusedCompletionTokenRef.current = lastCompletion.token;
      focusAccessibilityTarget(undoButtonRef.current);
    }
  }, [lastCompletion]);

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
    <View className="absolute inset-x-4 bottom-5 z-50 mx-auto max-w-xl rounded-2xl bg-ink px-4 py-3 shadow-lg">
      <View className="flex-row flex-wrap items-center gap-3">
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          className="min-w-[180px] flex-1 basis-60 text-sm font-semibold leading-5 text-white"
        >
          {message}
        </Text>
        <View className="flex-row flex-wrap items-center gap-2">
          <Pressable
            accessibilityHint={`Restores ${item.title} to active tasks`}
            accessibilityLabel={`Undo completion of ${item.title}`}
            accessibilityRole="button"
            accessibilityState={{ busy: isRestoring, disabled: isRestoring }}
            className="min-h-11 justify-center rounded-xl bg-white px-4 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-white"
            disabled={isRestoring}
            ref={undoButtonRef}
            onPress={() => {
              void undoLastCompletion().then((restored) => {
                if (!restored) return;
                focusCurrentPageHeading();
                announce(`Restored ${item.title} to active tasks.`);
              });
            }}
          >
            <Text className="font-extrabold text-ink">
              {isRestoring ? 'Restoring…' : 'Undo'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Dismiss Undo message"
            accessibilityRole="button"
            accessibilityState={{ disabled: isRestoring }}
            className="min-h-11 justify-center rounded-xl px-3 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-white"
            disabled={isRestoring}
            onPress={dismissUndo}
          >
            <Text className="font-extrabold text-white">Dismiss</Text>
          </Pressable>
        </View>
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
