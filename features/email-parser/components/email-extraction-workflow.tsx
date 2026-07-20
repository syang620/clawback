import { useEffect, useId, useRef } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';

import { PageHeading } from '@/components/page-heading';
import type { useEmailExtractionWorkflow } from '@/features/email-parser/use-email-extraction-workflow';
import { FinancialItemFields } from '@/features/financial-items/components/financial-item-fields';

type Workflow = ReturnType<typeof useEmailExtractionWorkflow>;

interface EmailExtractionWorkflowProps {
  isRouteFocused?: boolean;
  onCancel: () => void;
  onManualFallback: () => void;
  onSaved: () => void;
  workflow: Workflow;
}

export function EmailExtractionUnavailable({
  isRouteFocused = true,
  onBack,
}: {
  isRouteFocused?: boolean;
  onBack: () => void;
}) {
  return (
    <View className="mx-auto mt-8 w-full max-w-2xl">
      <PageHeading
        active={isRouteFocused}
        className="text-3xl font-black text-ink"
      >
        Extract from email
      </PageHeading>
      <View
        accessibilityLabel="Email extraction requires Connected mode"
        className="mt-6 rounded-2xl border border-line bg-surface px-5 py-5"
      >
        <Text className="text-base leading-6 text-ink">
          Email extraction requires Connected mode. You can still add a task
          manually.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        className="mt-6 min-h-12 justify-center self-start rounded-xl bg-ink px-5 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
        onPress={onBack}
      >
        <Text className="font-extrabold text-white">Choose a manual task</Text>
      </Pressable>
    </View>
  );
}

export function EmailExtractionWorkflow({
  isRouteFocused = true,
  onCancel,
  onManualFallback,
  onSaved,
  workflow,
}: EmailExtractionWorkflowProps) {
  const {
    clearSensitiveState,
    editEmail,
    emailCharacterCount,
    emailLimit,
    emailText,
    extract,
    failure,
    guidance,
    inputErrors,
    inputValidationFocusRequest,
    phase,
    retryRemainingSeconds,
    reviewErrors,
    reviewValidationFocusRequest,
    reviewValues,
    save,
    setEmailText,
    setSubject,
    subject,
    subjectCharacterCount,
    subjectLimit,
    updateReviewValue,
    warnings,
  } = workflow;
  const subjectRef = useRef<TextInput>(null);
  const emailTextRef = useRef<TextInput>(null);
  const handledInputFocusRequestRef = useRef(0);
  const subjectId = useId();
  const subjectLabelId = `${subjectId}-label`;
  const subjectMessageId = `${subjectId}-message`;
  const emailId = useId();
  const emailLabelId = `${emailId}-label`;
  const emailMessageId = `${emailId}-message`;

  useEffect(() => {
    if (
      inputValidationFocusRequest <= 0 ||
      handledInputFocusRequestRef.current === inputValidationFocusRequest
    ) {
      return;
    }
    handledInputFocusRequestRef.current = inputValidationFocusRequest;
    if (inputErrors.subject) {
      subjectRef.current?.focus();
    } else if (inputErrors.emailText) {
      emailTextRef.current?.focus();
    }
  }, [inputErrors, inputValidationFocusRequest]);

  const clearAndNavigate = (navigate: () => void) => {
    clearSensitiveState();
    navigate();
  };

  if (phase === 'review' || phase === 'saving' || phase === 'save-failure') {
    if (!reviewValues) return null;
    const saving = phase === 'saving';
    return (
      <View className="mx-auto mt-8 w-full max-w-2xl">
        <PageHeading
          active={isRouteFocused}
          className="text-3xl font-black text-ink"
        >
          Review extracted task
        </PageHeading>
        <Text className="mt-2 text-base leading-6 text-slate">
          Review and edit every field. Saving creates a tracking task only—it
          does not cancel, redeem, purchase, contact a merchant, or act for you.
        </Text>

        {warnings.length > 0 && (
          <View
            accessibilityLabel="Extraction warnings"
            className="mt-6 rounded-2xl border border-attention bg-amber-50 px-5 py-4"
          >
            <Text className="font-extrabold text-ink">Review carefully</Text>
            {warnings.map((warning, index) => (
              <Text className="mt-1 text-sm leading-5 text-slate" key={index}>
                {warning}
              </Text>
            ))}
          </View>
        )}

        {phase === 'save-failure' && (
          <View className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <Text
              accessibilityLiveRegion="assertive"
              accessibilityRole="alert"
              className="font-semibold text-risk"
            >
              We could not save this task. Your review edits are still here. Try
              Save again.
            </Text>
          </View>
        )}

        <View className="mt-7">
          <FinancialItemFields
            disabled={saving}
            errors={reviewErrors}
            onChange={updateReviewValue}
            recurrenceRequired
            validationFocusRequest={reviewValidationFocusRequest}
            values={reviewValues}
          />
        </View>

        <View className="mt-8 flex-row flex-wrap justify-end gap-3">
          <SecondaryButton
            disabled={saving}
            label="Edit email"
            onPress={editEmail}
          />
          <SecondaryButton
            disabled={saving}
            label="Cancel"
            onPress={() => clearAndNavigate(onCancel)}
          />
          <Pressable
            accessibilityHint="Creates an active tracking task after your review"
            accessibilityRole="button"
            accessibilityState={{ busy: saving, disabled: saving }}
            className="min-h-12 justify-center rounded-xl bg-ink px-6 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
            disabled={saving}
            onPress={() => {
              void save().then((saved) => {
                if (saved) onSaved();
              });
            }}
          >
            <Text className="font-extrabold text-white">
              {saving ? 'Saving…' : 'Save task'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === 'no-actionable') {
    return (
      <View className="mx-auto mt-8 w-full max-w-2xl">
        <PageHeading
          active={isRouteFocused}
          className="text-3xl font-black text-ink"
        >
          No clear financial task found
        </PageHeading>
        <Text className="mt-3 text-base leading-6 text-slate">
          Clawback could not safely turn this email into a tracking task. Your
          pasted text is still here.
        </Text>
        <View className="mt-7 flex-row flex-wrap gap-3">
          <SecondaryButton label="Edit email" onPress={editEmail} />
          <PrimaryButton label="Try again" onPress={() => void extract()} />
          <SecondaryButton
            label="Add manually"
            onPress={() => clearAndNavigate(onManualFallback)}
          />
          <SecondaryButton
            label="Cancel"
            onPress={() => clearAndNavigate(onCancel)}
          />
        </View>
      </View>
    );
  }

  const extracting = phase === 'extracting';
  const rateLimited = failure?.code === 'rate_limited';
  const retryBlocked = retryRemainingSeconds > 0;
  const actionLabel = extracting
    ? 'Extracting…'
    : phase === 'extraction-failure'
      ? rateLimited && retryBlocked
        ? `Retry in ${retryRemainingSeconds}s`
        : 'Retry extraction'
      : 'Extract task';

  return (
    <View className="mx-auto mt-8 w-full max-w-2xl">
      <PageHeading
        active={isRouteFocused}
        className="text-3xl font-black text-ink"
      >
        Extract from email
      </PageHeading>
      <Text className="mt-2 text-base leading-6 text-slate">
        Paste only the message you want analyzed. It is sent securely for
        extraction, is not stored by Clawback, and every result requires your
        review before saving.
      </Text>

      {guidance && (
        <View
          accessibilityLiveRegion="polite"
          className="mt-6 rounded-xl border border-line bg-surface px-4 py-3"
        >
          <Text className="font-semibold text-ink">{guidance}</Text>
        </View>
      )}

      {failure && (
        <View className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <Text
            accessibilityLiveRegion="assertive"
            accessibilityRole="alert"
            className="font-semibold text-risk"
          >
            {failure.message}
          </Text>
          {rateLimited && retryBlocked && (
            <Text className="mt-1 text-sm text-slate">
              You can retry in {retryRemainingSeconds} seconds. Editing and
              manual entry remain available.
            </Text>
          )}
        </View>
      )}

      {extracting && (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-6 text-sm font-semibold text-slate"
          role="status"
        >
          Analyzing the pasted email for a financial task…
        </Text>
      )}

      <View className="mt-7 gap-7">
        <View>
          <Text
            className="text-sm font-extrabold text-ink"
            nativeID={subjectLabelId}
          >
            Subject <Text className="font-semibold text-slate">(optional)</Text>
          </Text>
          <TextInput
            accessibilityHint={inputErrors.subject}
            accessibilityLabel="Email subject, optional"
            className={`mt-2 min-h-12 rounded-xl border bg-surface px-4 py-3 text-base text-ink web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand ${inputErrors.subject ? 'border-risk' : 'border-line'}`}
            editable={!extracting}
            onChangeText={setSubject}
            placeholder="Renewal reminder"
            placeholderTextColor="#7A8794"
            ref={subjectRef}
            value={subject}
            {...(Platform.OS === 'web'
              ? {
                  'aria-describedby': subjectMessageId,
                  'aria-invalid': Boolean(inputErrors.subject),
                  'aria-labelledby': subjectLabelId,
                }
              : {})}
          />
          <CharacterCount
            count={subjectCharacterCount}
            error={inputErrors.subject}
            label="Subject"
            limit={subjectLimit}
            messageId={subjectMessageId}
          />
        </View>

        <View>
          <Text
            className="text-sm font-extrabold text-ink"
            nativeID={emailLabelId}
          >
            Email text{' '}
            <Text className="font-semibold text-slate">(required)</Text>
          </Text>
          <TextInput
            accessibilityHint={inputErrors.emailText}
            accessibilityLabel="Email text, required"
            className={`mt-2 min-h-64 rounded-xl border bg-surface px-4 py-4 text-base leading-6 text-ink web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand ${inputErrors.emailText ? 'border-risk' : 'border-line'}`}
            editable={!extracting}
            multiline
            onChangeText={setEmailText}
            placeholder="Paste the financial email here"
            placeholderTextColor="#7A8794"
            ref={emailTextRef}
            textAlignVertical="top"
            value={emailText}
            {...(Platform.OS === 'web'
              ? {
                  'aria-describedby': emailMessageId,
                  'aria-invalid': Boolean(inputErrors.emailText),
                  'aria-labelledby': emailLabelId,
                  'aria-required': true,
                }
              : {})}
          />
          <CharacterCount
            count={emailCharacterCount}
            error={inputErrors.emailText}
            label="Email text"
            limit={emailLimit}
            messageId={emailMessageId}
          />
        </View>
      </View>

      <View className="mt-8 flex-row flex-wrap justify-end gap-3">
        {phase === 'extraction-failure' && (
          <SecondaryButton
            label="Add manually"
            onPress={() => clearAndNavigate(onManualFallback)}
          />
        )}
        <SecondaryButton
          label="Cancel"
          onPress={() => clearAndNavigate(onCancel)}
        />
        <PrimaryButton
          busy={extracting}
          disabled={extracting || retryBlocked}
          label={actionLabel}
          onPress={() => void extract()}
        />
      </View>
    </View>
  );
}

function CharacterCount({
  count,
  error,
  label,
  limit,
  messageId,
}: {
  count: number;
  error?: string;
  label: string;
  limit: number;
  messageId: string;
}) {
  return (
    <View className="mt-1.5 flex-row flex-wrap justify-between gap-2">
      <Text
        accessibilityLiveRegion={error ? 'polite' : 'none'}
        className={`text-sm ${error ? 'font-semibold text-risk' : 'text-slate'}`}
        nativeID={messageId}
      >
        {error ?? `${label} character count`}
      </Text>
      <Text
        accessibilityLabel={`${label}: ${count} of ${limit} characters`}
        className={`text-sm ${count > limit ? 'font-semibold text-risk' : 'text-slate'}`}
      >
        {count.toLocaleString('en-US')} / {limit.toLocaleString('en-US')}
      </Text>
    </View>
  );
}

function PrimaryButton({
  busy = false,
  disabled = false,
  label,
  onPress,
}: {
  busy?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy, disabled }}
      className={`min-h-12 justify-center rounded-xl px-6 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand ${disabled ? 'bg-slate' : 'bg-ink'}`}
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="font-extrabold text-white">{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  disabled = false,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className="min-h-12 justify-center rounded-xl border border-line bg-surface px-5 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="font-extrabold text-ink">{label}</Text>
    </Pressable>
  );
}
