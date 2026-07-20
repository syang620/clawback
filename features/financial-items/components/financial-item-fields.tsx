import { type Ref, useEffect, useId, useMemo, useRef } from 'react';
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  type View as ViewType,
  View,
} from 'react-native';

import { focusAccessibilityTarget } from '@/components/accessibility-focus';
import { DeadlineField } from '@/features/financial-items/components/deadline-field';
import type { DeadlineFieldHandle } from '@/features/financial-items/components/deadline-field.types';
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
  validationFocusRequest?: number;
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

export function findFirstInvalidFinancialItemField(
  errors: ManualFinancialItemErrors,
  kind: FinancialItemKind | null,
): ManualFinancialItemField | undefined {
  const moneyFields: ManualFinancialItemField[] =
    kind === 'perk'
      ? ['valueAvailable', 'chargeAtRisk']
      : ['chargeAtRisk', 'valueAvailable'];
  const orderedFields: ManualFinancialItemField[] = [
    'kind',
    'title',
    'deadline',
    ...moneyFields,
    'recurrence',
    'actionUrl',
  ];
  return orderedFields.find((field) => errors[field]);
}

function LabeledTextInput({
  error,
  hint,
  inputRef,
  label,
  optional = false,
  ...inputProps
}: LabeledTextInputProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const messageId = `${id}-message`;

  return (
    <View>
      <Text className="text-sm font-extrabold text-ink" nativeID={labelId}>
        {label}{' '}
        <Text className="font-semibold text-slate">
          {optional ? '(optional)' : '(required)'}
        </Text>
      </Text>
      <TextInput
        accessibilityHint={error ?? hint}
        accessibilityLabel={`${label}, ${optional ? 'optional' : 'required'}`}
        className={`mt-2 min-h-12 rounded-xl border bg-surface px-4 py-3 text-base text-ink web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand ${
          error ? 'border-risk' : 'border-line'
        }`}
        placeholderTextColor="#7A8794"
        ref={inputRef}
        {...(Platform.OS === 'web'
          ? {
              'aria-describedby': error || hint ? messageId : undefined,
              'aria-invalid': Boolean(error),
              'aria-labelledby': labelId,
              'aria-required': !optional,
            }
          : {})}
        {...inputProps}
      />
      {(error || hint) && (
        <Text
          accessibilityLiveRegion={error ? 'polite' : 'none'}
          className={`mt-1.5 text-sm leading-5 ${error ? 'font-semibold text-risk' : 'text-slate'}`}
          nativeID={messageId}
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
  validationFocusRequest = 0,
  values,
}: FinancialItemFieldsProps) {
  const moneyFields = useMemo(
    () =>
      values.kind === 'perk'
        ? (['valueAvailable', 'chargeAtRisk'] as const)
        : (['chargeAtRisk', 'valueAvailable'] as const),
    [values.kind],
  );
  const kindLabelId = useId();
  const kindErrorId = `${kindLabelId}-error`;
  const recurrenceLabelId = useId();
  const recurrenceErrorId = `${recurrenceLabelId}-error`;
  const kindRefs = useRef<Partial<Record<FinancialItemKind, ViewType | null>>>(
    {},
  );
  const recurrenceRefs = useRef<Partial<Record<Recurrence, ViewType | null>>>(
    {},
  );
  const titleRef = useRef<TextInput>(null);
  const valueAvailableRef = useRef<TextInput>(null);
  const chargeAtRiskRef = useRef<TextInput>(null);
  const actionUrlRef = useRef<TextInput>(null);
  const deadlineRef = useRef<DeadlineFieldHandle>(null);
  const handledFocusRequestRef = useRef(0);

  useEffect(() => {
    if (
      validationFocusRequest <= 0 ||
      handledFocusRequestRef.current === validationFocusRequest
    ) {
      return;
    }
    handledFocusRequestRef.current = validationFocusRequest;

    const firstInvalidField = findFirstInvalidFinancialItemField(
      errors,
      values.kind,
    );
    switch (firstInvalidField) {
      case 'kind':
        focusAccessibilityTarget(
          kindRefs.current[values.kind ?? financialItemKinds[0]],
        );
        break;
      case 'title':
        focusAccessibilityTarget(titleRef.current);
        break;
      case 'deadline':
        deadlineRef.current?.focus();
        break;
      case 'valueAvailable':
        focusAccessibilityTarget(valueAvailableRef.current);
        break;
      case 'chargeAtRisk':
        focusAccessibilityTarget(chargeAtRiskRef.current);
        break;
      case 'recurrence':
        focusAccessibilityTarget(
          recurrenceRefs.current[values.recurrence ?? recurrenceOptions[0]],
        );
        break;
      case 'actionUrl':
        focusAccessibilityTarget(actionUrlRef.current);
        break;
    }
  }, [errors, validationFocusRequest, values.kind, values.recurrence]);

  return (
    <View className="gap-7">
      <View>
        <Text
          className="text-sm font-extrabold text-ink"
          nativeID={kindLabelId}
        >
          Task type <Text className="font-semibold text-slate">(required)</Text>
        </Text>
        <View
          accessibilityLabel="Task type"
          accessibilityHint={errors.kind ? `Error: ${errors.kind}` : undefined}
          accessibilityRole="radiogroup"
          className="mt-2 flex-row flex-wrap gap-2"
          {...(Platform.OS === 'web'
            ? {
                'aria-describedby': errors.kind ? kindErrorId : undefined,
                'aria-invalid': Boolean(errors.kind),
                'aria-labelledby': kindLabelId,
                'aria-required': true,
              }
            : {})}
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
                ref={(node) => {
                  kindRefs.current[kind] = node;
                }}
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
            nativeID={kindErrorId}
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
        ref={deadlineRef}
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
                inputRef={isValue ? valueAvailableRef : chargeAtRiskRef}
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
        <Text
          className="text-sm font-extrabold text-ink"
          nativeID={recurrenceLabelId}
        >
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
          accessibilityHint={
            errors.recurrence ? `Error: ${errors.recurrence}` : undefined
          }
          accessibilityRole="radiogroup"
          className="mt-2 flex-row flex-wrap gap-2"
          {...(Platform.OS === 'web'
            ? {
                'aria-describedby': errors.recurrence
                  ? recurrenceErrorId
                  : undefined,
                'aria-invalid': Boolean(errors.recurrence),
                'aria-labelledby': recurrenceLabelId,
                'aria-required': recurrenceRequired,
              }
            : {})}
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
                ref={(node) => {
                  recurrenceRefs.current[recurrence] = node;
                }}
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
            nativeID={recurrenceErrorId}
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
        inputRef={actionUrlRef}
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
