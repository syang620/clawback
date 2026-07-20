import { type Ref, useMemo } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { DeadlineField } from '@/features/financial-items/components/deadline-field';
import {
  financialItemKinds,
  type ManualFinancialItemErrors,
  type ManualFinancialItemField,
  recurrenceOptions,
} from '@/features/financial-items/logic/manual-entry';
import type { FinancialItemKind, Recurrence } from '@/types/financial-item';

export interface FinancialItemEditorValues {
  actionUrl: string;
  chargeAtRisk: string;
  deadline: string;
  kind: FinancialItemKind | null;
  provider: string;
  recurrence: Recurrence | null;
  title: string;
  valueAvailable: string;
}

interface FinancialItemFieldsProps {
  disabled?: boolean;
  errors: ManualFinancialItemErrors;
  onChange: <Field extends keyof FinancialItemEditorValues>(
    field: Field,
    value: FinancialItemEditorValues[Field],
  ) => void;
  recurrenceRequired?: boolean;
  titleRef?: Ref<TextInput>;
  values: FinancialItemEditorValues;
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
  none: 'One time',
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

export function FinancialItemFields({
  disabled = false,
  errors,
  onChange,
  recurrenceRequired = false,
  titleRef,
  values,
}: FinancialItemFieldsProps) {
  const moneyFields = useMemo(
    () =>
      values.kind === 'perk'
        ? (['valueAvailable', 'chargeAtRisk'] as const)
        : (['chargeAtRisk', 'valueAvailable'] as const),
    [values.kind],
  );

  return (
    <View className="gap-7">
      <View>
        <Text className="text-sm font-extrabold text-ink">
          Task type <Text className="font-semibold text-slate">(required)</Text>
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
                accessibilityState={{ checked: selected, disabled }}
                className={`min-h-11 justify-center rounded-xl border px-4 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand ${
                  selected
                    ? 'border-brand bg-blue-50'
                    : errors.kind
                      ? 'border-risk bg-surface'
                      : 'border-line bg-surface'
                }`}
                key={kind}
                disabled={disabled}
                onPress={() => onChange('kind', kind)}
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
        editable={!disabled}
        label="Title"
        onChangeText={(value) => onChange('title', value)}
        placeholder="Review annual renewal"
        returnKeyType="next"
        value={values.title}
      />

      <LabeledTextInput
        autoCapitalize="words"
        label="Provider"
        editable={!disabled}
        onChangeText={(value) => onChange('provider', value)}
        optional
        placeholder="Streaming service"
        returnKeyType="next"
        value={values.provider}
      />

      <DeadlineField
        disabled={disabled}
        error={errors.deadline}
        onChange={(value) => onChange('deadline', value)}
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
                editable={!disabled}
                hint={
                  isPrimary
                    ? isValue
                      ? 'For perks, this amount updates Available.'
                      : 'For trials and subscriptions, this amount updates At Risk.'
                    : 'Stored as optional context; dashboard metrics use the type-specific amount.'
                }
                inputMode="decimal"
                label={isValue ? 'Value available' : 'Charge at risk'}
                onChangeText={(value) => onChange(field, value)}
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
          <Text className="font-semibold text-slate">
            {recurrenceRequired ? '(required)' : '(optional)'}
          </Text>
        </Text>
        {!values.recurrence && (
          <Text className="mt-1.5 text-sm text-slate">Not specified</Text>
        )}
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
                accessibilityState={{ checked: selected, disabled }}
                className={`min-h-11 justify-center rounded-xl border px-3 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand ${
                  selected
                    ? 'border-brand bg-blue-50'
                    : errors.recurrence
                      ? 'border-risk bg-surface'
                      : 'border-line bg-surface'
                }`}
                key={recurrence}
                disabled={disabled}
                onPress={() => onChange('recurrence', recurrence)}
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
        {errors.recurrence && (
          <Text
            accessibilityLiveRegion="polite"
            className="mt-1.5 text-sm font-semibold text-risk"
          >
            {errors.recurrence}
          </Text>
        )}
      </View>

      <LabeledTextInput
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.actionUrl}
        editable={!disabled}
        hint="Must begin with https://. Clawback will only open it after you choose to do so."
        keyboardType="url"
        label="Action URL"
        onChangeText={(value) => onChange('actionUrl', value)}
        optional
        placeholder="https://example.com/account"
        returnKeyType="done"
        value={values.actionUrl}
      />
    </View>
  );
}
