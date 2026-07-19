import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import {
  FinancialItemFields,
  type FinancialItemEditorValues,
} from '@/features/financial-items/components/financial-item-fields';
import {
  createEmptyManualFinancialItemForm,
  type ManualFinancialItemErrors,
  type ManualFinancialItemField,
  type ManualFinancialItemFormValues,
  validateManualFinancialItem,
} from '@/features/financial-items/logic/manual-entry';
import type {
  CreateFinancialItemInput,
  FinancialItemKind,
} from '@/types/financial-item';

interface ManualFinancialItemFormProps {
  initialKind?: FinancialItemKind | null;
  onCancel: () => void;
  onDismissSaveError?: () => void;
  onSave: (input: CreateFinancialItemInput) => Promise<boolean>;
  saveError?: { message: string } | null;
}

export function ManualFinancialItemForm({
  initialKind = null,
  onCancel,
  onDismissSaveError,
  onSave,
  saveError = null,
}: ManualFinancialItemFormProps) {
  const [values, setValues] = useState<ManualFinancialItemFormValues>(() =>
    createEmptyManualFinancialItemForm(initialKind),
  );
  const [errors, setErrors] = useState<ManualFinancialItemErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const titleRef = useRef<TextInput>(null);

  const updateValue = <Field extends keyof ManualFinancialItemFormValues>(
    field: Field,
    value: ManualFinancialItemFormValues[Field],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field as ManualFinancialItemField];
      return next;
    });
    setFormError(null);
    onDismissSaveError?.();
  };

  const updateEditorValue = <Field extends keyof FinancialItemEditorValues>(
    field: Field,
    value: FinancialItemEditorValues[Field],
  ) => {
    if (field === 'recurrence' && value === null) return;
    updateValue(field as keyof ManualFinancialItemFormValues, value as never);
  };

  const submit = async () => {
    if (isSubmittingRef.current) return;

    const result = validateManualFinancialItem(values);
    if (!result.ok) {
      setErrors(result.errors);
      setFormError('Review the highlighted fields before saving.');
      if (result.errors.title) titleRef.current?.focus();
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setFormError(null);
    onDismissSaveError?.();
    try {
      await onSave(result.input);
    } catch {
      setFormError('We could not save this task. Your entries are still here.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const displayedFormError = formError ?? saveError?.message ?? null;

  return (
    <View className="mx-auto mt-8 w-full max-w-2xl">
      <Text accessibilityRole="header" className="text-3xl font-black text-ink">
        Create a task
      </Text>
      <Text className="mt-2 text-base leading-6 text-slate">
        Saving creates an active reminder. Clawback does not cancel, redeem,
        charge, or perform a financial action.
      </Text>

      {displayedFormError && (
        <View
          accessibilityLiveRegion="assertive"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <Text className="font-semibold text-risk">{displayedFormError}</Text>
        </View>
      )}

      <View className="mt-7">
        <FinancialItemFields
          errors={errors}
          onChange={updateEditorValue}
          titleRef={titleRef}
          values={values}
        />
      </View>

      <View className="mt-8 flex-row flex-wrap justify-end gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
          className="min-h-12 justify-center rounded-xl border border-line bg-surface px-5 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
          disabled={isSubmitting}
          onPress={onCancel}
        >
          <Text className="font-extrabold text-ink">Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityHint="Creates an active financial reminder"
          accessibilityRole="button"
          accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }}
          className="min-h-12 justify-center rounded-xl bg-ink px-6 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
          disabled={isSubmitting}
          onPress={() => {
            void submit();
          }}
        >
          <Text className="font-extrabold text-white">
            {isSubmitting ? 'Saving…' : 'Save task'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
