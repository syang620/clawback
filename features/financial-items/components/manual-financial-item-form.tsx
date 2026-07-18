import { type Ref, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import {
  createEmptyManualFinancialItemForm,
  financialItemKinds,
  type ManualFinancialItemErrors,
  type ManualFinancialItemField,
  type ManualFinancialItemFormValues,
  recurrenceOptions,
  validateManualFinancialItem,
} from '@/features/financial-items/logic/manual-entry';
import type {
  CreateFinancialItemInput,
  FinancialItemKind,
  Recurrence,
} from '@/types/financial-item';

interface ManualFinancialItemFormProps {
  initialKind?: FinancialItemKind | null;
  onCancel: () => void;
  onSave: (input: CreateFinancialItemInput) => void;
}

interface LabeledTextInputProps extends TextInputProps {
  error?: string;
  hint?: string;
  inputRef?: Ref<TextInput>;
  label: string;
  optional?: boolean;
}

const kindLabels: Record<FinancialItemKind, string> = {
  trial: 'Trial',
  perk: 'Perk',
  subscription: 'Subscription',
};

const recurrenceLabels: Record<Recurrence, string> = {
  none: 'Does not repeat',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
  custom: 'Custom',
};

function LabeledTextInput({
  error,
  hint,
  inputRef,
  label,
  optional = false,
  ...inputProps
}: LabeledTextInputProps) {
  return (
    <View>
      <Text className="text-sm font-extrabold text-ink">
        {label}{' '}
        <Text className="font-semibold text-slate">
          {optional ? '(optional)' : '(required)'}
        </Text>
      </Text>
      <TextInput
        accessibilityHint={error ?? hint}
        accessibilityLabel={`${label}${optional ? ', optional' : ', required'}${error ? `. Error: ${error}` : ''}`}
        className={`mt-2 min-h-12 rounded-xl border bg-surface px-4 py-3 text-base text-ink web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand ${
          error ? 'border-risk' : 'border-line'
        }`}
        placeholderTextColor="#7A8794"
        ref={inputRef}
        {...inputProps}
      />
      {(error || hint) && (
        <Text
          accessibilityLiveRegion={error ? 'polite' : 'none'}
          className={`mt-1.5 text-sm leading-5 ${error ? 'font-semibold text-risk' : 'text-slate'}`}
        >
          {error ?? hint}
        </Text>
      )}
    </View>
  );
}

export function ManualFinancialItemForm({
  initialKind = null,
  onCancel,
  onSave,
}: ManualFinancialItemFormProps) {
  const [values, setValues] = useState<ManualFinancialItemFormValues>(() =>
    createEmptyManualFinancialItemForm(initialKind),
  );
  const [errors, setErrors] = useState<ManualFinancialItemErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const titleRef = useRef<TextInput>(null);

  const moneyFields = useMemo(
    () =>
      values.kind === 'perk'
        ? (['valueAvailable', 'chargeAtRisk'] as const)
        : (['chargeAtRisk', 'valueAvailable'] as const),
    [values.kind],
  );

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
  };

  const submit = () => {
    if (isSubmittingRef.current) return;

    const result = validateManualFinancialItem(values);
    if (!result.ok) {
      setErrors(result.errors);
      setFormError('Review the highlighted fields before saving.');
      if (result.errors.title) titleRef.current?.focus();
      return;
    }

    isSubmittingRef.current = true;
    try {
      onSave(result.input);
    } catch {
      isSubmittingRef.current = false;
      setFormError('We could not save this task. Your entries are still here.');
    }
  };

  return (
    <View className="mx-auto mt-8 w-full max-w-2xl">
      <Text accessibilityRole="header" className="text-3xl font-black text-ink">
        Create a task
      </Text>
      <Text className="mt-2 text-base leading-6 text-slate">
        Saving creates a reminder in this local session. Clawback does not
        cancel, redeem, charge, or perform a financial action.
      </Text>

      {formError && (
        <View
          accessibilityLiveRegion="assertive"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <Text className="font-semibold text-risk">{formError}</Text>
        </View>
      )}

      <View className="mt-7 gap-7">
        <View>
          <Text className="text-sm font-extrabold text-ink">
            Task type{' '}
            <Text className="font-semibold text-slate">(required)</Text>
          </Text>
          <View
            accessibilityLabel="Task type"
            accessibilityRole="radiogroup"
            className="mt-2 flex-row flex-wrap gap-2"
          >
            {financialItemKinds.map((kind) => {
              const selected = values.kind === kind;
              return (
                <Pressable
                  accessibilityLabel={kindLabels[kind]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  className={`min-h-11 justify-center rounded-xl border px-4 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand ${
                    selected
                      ? 'border-brand bg-blue-50'
                      : errors.kind
                        ? 'border-risk bg-surface'
                        : 'border-line bg-surface'
                  }`}
                  key={kind}
                  onPress={() => updateValue('kind', kind)}
                >
                  <Text
                    className={`font-extrabold ${selected ? 'text-brand' : 'text-ink'}`}
                  >
                    {kindLabels[kind]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {errors.kind && (
            <Text
              accessibilityLiveRegion="polite"
              className="mt-1.5 text-sm font-semibold text-risk"
            >
              {errors.kind}
            </Text>
          )}
        </View>

        <LabeledTextInput
          autoCapitalize="sentences"
          error={errors.title}
          inputRef={titleRef}
          label="Title"
          onChangeText={(value) => updateValue('title', value)}
          placeholder="Review annual renewal"
          returnKeyType="next"
          value={values.title}
        />

        <LabeledTextInput
          autoCapitalize="words"
          error={undefined}
          label="Provider"
          onChangeText={(value) => updateValue('provider', value)}
          optional
          placeholder="Streaming service"
          returnKeyType="next"
          value={values.provider}
        />

        <LabeledTextInput
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.deadline}
          hint="Use YYYY-MM-DD, for example 2026-07-31. Calendar dates are stored without a time."
          keyboardType={
            Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'
          }
          label="Deadline"
          onChangeText={(value) => updateValue('deadline', value)}
          placeholder="YYYY-MM-DD"
          returnKeyType="next"
          value={values.deadline}
        />

        <View className="gap-7 md:flex-row">
          {moneyFields.map((field) => {
            const isValue = field === 'valueAvailable';
            const isPrimary =
              (values.kind === 'perk' && isValue) ||
              (values.kind !== 'perk' && !isValue);
            return (
              <View className="flex-1" key={field}>
                <LabeledTextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors[field]}
                  hint={
                    isPrimary
                      ? isValue
                        ? 'For perks, this amount updates Available.'
                        : 'For trials and subscriptions, this amount updates At Risk.'
                      : 'Stored as optional context; dashboard metrics use the type-specific amount.'
                  }
                  inputMode="decimal"
                  label={isValue ? 'Value available' : 'Charge at risk'}
                  onChangeText={(value) => updateValue(field, value)}
                  optional
                  placeholder="0.00"
                  value={values[field]}
                />
              </View>
            );
          })}
        </View>

        <View>
          <Text className="text-sm font-extrabold text-ink">
            Recurrence{' '}
            <Text className="font-semibold text-slate">(optional)</Text>
          </Text>
          <View
            accessibilityLabel="Recurrence"
            accessibilityRole="radiogroup"
            className="mt-2 flex-row flex-wrap gap-2"
          >
            {recurrenceOptions.map((recurrence) => {
              const selected = values.recurrence === recurrence;
              return (
                <Pressable
                  accessibilityLabel={recurrenceLabels[recurrence]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  className={`min-h-11 justify-center rounded-xl border px-3 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand ${
                    selected
                      ? 'border-brand bg-blue-50'
                      : 'border-line bg-surface'
                  }`}
                  key={recurrence}
                  onPress={() => updateValue('recurrence', recurrence)}
                >
                  <Text
                    className={`text-sm font-extrabold ${selected ? 'text-brand' : 'text-ink'}`}
                  >
                    {recurrenceLabels[recurrence]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <LabeledTextInput
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.actionUrl}
          hint="Must begin with https://. Clawback will only open it after you choose to do so."
          keyboardType="url"
          label="Action URL"
          onChangeText={(value) => updateValue('actionUrl', value)}
          optional
          placeholder="https://example.com/account"
          returnKeyType="done"
          value={values.actionUrl}
        />
      </View>

      <View className="mt-8 flex-row flex-wrap justify-end gap-3">
        <Pressable
          accessibilityRole="button"
          className="min-h-12 justify-center rounded-xl border border-line bg-surface px-5 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
          onPress={onCancel}
        >
          <Text className="font-extrabold text-ink">Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityHint="Creates an active reminder in this local session"
          accessibilityRole="button"
          className="min-h-12 justify-center rounded-xl bg-ink px-6 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
          onPress={submit}
        >
          <Text className="font-extrabold text-white">Save task</Text>
        </Pressable>
      </View>
    </View>
  );
}
