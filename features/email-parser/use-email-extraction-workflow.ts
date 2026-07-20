import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  FinancialEmailClientError,
  type FinancialEmailClientErrorCode,
  type FinancialEmailParser,
  FinancialEmailRequestAbortedError,
} from '@/features/email-parser/types';
import {
  createEmailReviewValues,
  type EmailReviewValues,
  validateEmailReview,
} from '@/features/email-parser/review';
import {
  deriveReferenceDate,
  resolveDeviceTimeZone,
} from '@/features/email-parser/reference-date';
import type { ManualFinancialItemErrors } from '@/features/financial-items/logic/manual-entry';
import type {
  CreateFinancialItemInput,
  FinancialItem,
} from '@/types/financial-item';

const EMAIL_LIMIT = 20_000;
const SUBJECT_LIMIT = 500;
const BACKGROUND_GUIDANCE =
  'Extraction paused while the app was in the background. Your email is still here.';
const systemNow = () => new Date();

export type EmailExtractionPhase =
  | 'input'
  | 'extracting'
  | 'review'
  | 'no-actionable'
  | 'extraction-failure'
  | 'saving'
  | 'save-failure';

export interface EmailInputErrors {
  emailText?: string;
  subject?: string;
}

export interface EmailExtractionFailure {
  code: FinancialEmailClientErrorCode;
  message: string;
  retryable: boolean;
}

interface UseEmailExtractionWorkflowOptions {
  createItem: (
    input: CreateFinancialItemInput,
  ) => Promise<FinancialItem | null>;
  isFocused: boolean;
  now?: () => Date;
  parser: FinancialEmailParser;
  resolveTimeZone?: () => string;
}

export function useEmailExtractionWorkflow({
  createItem,
  isFocused,
  now = systemNow,
  parser,
  resolveTimeZone = resolveDeviceTimeZone,
}: UseEmailExtractionWorkflowOptions) {
  const [phase, setPhase] = useState<EmailExtractionPhase>('input');
  const [emailText, setEmailTextState] = useState('');
  const [subject, setSubjectState] = useState('');
  const [inputErrors, setInputErrors] = useState<EmailInputErrors>({});
  const [inputValidationFocusRequest, setInputValidationFocusRequest] =
    useState(0);
  const [guidance, setGuidance] = useState<string | null>(null);
  const [failure, setFailure] = useState<EmailExtractionFailure | null>(null);
  const [reviewValues, setReviewValues] = useState<EmailReviewValues | null>(
    null,
  );
  const [reviewErrors, setReviewErrors] = useState<ManualFinancialItemErrors>(
    {},
  );
  const [reviewValidationFocusRequest, setReviewValidationFocusRequest] =
    useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [retryRemainingSeconds, setRetryRemainingSeconds] = useState(0);

  const mountedRef = useRef(false);
  const focusedRef = useRef(isFocused);
  const activeAppRef = useRef(
    AppState.currentState !== 'background' &&
      AppState.currentState !== 'inactive',
  );
  const generationRef = useRef(0);
  const extractionPendingRef = useRef(false);
  const savePendingRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const retryUntilRef = useRef<number | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emailTextRef = useRef('');
  const subjectRef = useRef('');

  const stopRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    retryUntilRef.current = null;
    setRetryRemainingSeconds(0);
  }, []);

  const abortExtraction = useCallback(() => {
    generationRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    extractionPendingRef.current = false;
  }, []);

  const clearSensitiveState = useCallback(() => {
    abortExtraction();
    stopRetryTimer();
    savePendingRef.current = false;
    emailTextRef.current = '';
    subjectRef.current = '';
    setEmailTextState('');
    setSubjectState('');
    setInputErrors({});
    setInputValidationFocusRequest(0);
    setGuidance(null);
    setFailure(null);
    setReviewValues(null);
    setReviewErrors({});
    setReviewValidationFocusRequest(0);
    setWarnings([]);
    setConfidence(null);
    setPhase('input');
  }, [abortExtraction, stopRetryTimer]);

  const clearSensitiveRefs = useCallback(() => {
    generationRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    extractionPendingRef.current = false;
    savePendingRef.current = false;
    emailTextRef.current = '';
    subjectRef.current = '';
    if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    retryTimerRef.current = null;
    retryUntilRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearSensitiveRefs();
    };
  }, [clearSensitiveRefs]);

  useEffect(() => {
    focusedRef.current = isFocused;
    if (!isFocused && mountedRef.current) clearSensitiveState();
  }, [clearSensitiveState, isFocused]);

  const pauseForBackground = useCallback(() => {
    if (!extractionPendingRef.current) return;
    abortExtraction();
    stopRetryTimer();
    if (!mountedRef.current || !focusedRef.current) return;
    setFailure(null);
    setGuidance(BACKGROUND_GUIDANCE);
    setPhase('input');
  }, [abortExtraction, stopRetryTimer]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        activeAppRef.current = nextState === 'active';
        if (nextState !== 'active') pauseForBackground();
      },
    );
    return () => subscription?.remove?.();
  }, [pauseForBackground]);

  const setEmailText = useCallback((value: string) => {
    emailTextRef.current = value;
    setEmailTextState(value);
    setInputErrors((current) => ({ ...current, emailText: undefined }));
    setGuidance(null);
  }, []);

  const setSubject = useCallback((value: string) => {
    subjectRef.current = value;
    setSubjectState(value);
    setInputErrors((current) => ({ ...current, subject: undefined }));
  }, []);

  const updateReviewValue = useCallback(
    <Field extends keyof EmailReviewValues>(
      field: Field,
      value: EmailReviewValues[Field],
    ) => {
      setReviewValues((current) =>
        current ? { ...current, [field]: value } : current,
      );
      setReviewErrors((current) => {
        if (!(field in current)) return current;
        const next = { ...current };
        delete next[field as keyof ManualFinancialItemErrors];
        return next;
      });
      if (phase === 'save-failure') setPhase('review');
    },
    [phase],
  );

  const refreshRetryRemaining = useCallback(() => {
    const retryUntil = retryUntilRef.current;
    if (!retryUntil) return;
    const remaining = Math.max(
      0,
      Math.ceil((retryUntil - now().getTime()) / 1_000),
    );
    setRetryRemainingSeconds(remaining);
    if (remaining === 0) stopRetryTimer();
  }, [now, stopRetryTimer]);

  const beginRetryCountdown = useCallback(
    (seconds: number) => {
      stopRetryTimer();
      retryUntilRef.current = now().getTime() + seconds * 1_000;
      setRetryRemainingSeconds(seconds);
      retryTimerRef.current = setInterval(refreshRetryRemaining, 1_000);
    },
    [now, refreshRetryRemaining, stopRetryTimer],
  );

  const extract = useCallback(async (): Promise<boolean> => {
    if (extractionPendingRef.current || retryUntilRef.current) return false;

    const trimmedEmail = emailTextRef.current.trim();
    const trimmedSubject = subjectRef.current.trim();
    const errors: EmailInputErrors = {};
    if (!trimmedEmail) {
      errors.emailText = 'Paste the email text to continue.';
    } else if (trimmedEmail.length > EMAIL_LIMIT) {
      errors.emailText = 'Email text must be 20,000 characters or fewer.';
    }
    if (trimmedSubject.length > SUBJECT_LIMIT) {
      errors.subject = 'Subject must be 500 characters or fewer.';
    }
    if (Object.keys(errors).length > 0) {
      setInputErrors(errors);
      setInputValidationFocusRequest((current) => current + 1);
      setGuidance(null);
      setPhase('input');
      return false;
    }

    abortExtraction();
    stopRetryTimer();
    extractionPendingRef.current = true;
    const generation = generationRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;
    setFailure(null);
    setGuidance(null);
    setInputErrors({});
    setReviewValues(null);
    setReviewErrors({});
    setReviewValidationFocusRequest(0);
    setWarnings([]);
    setConfidence(null);
    setPhase('extracting');

    try {
      const timeZone = resolveTimeZone();
      const extraction = await parser.extract(
        {
          emailText: trimmedEmail,
          ...(trimmedSubject ? { subject: trimmedSubject } : {}),
          referenceDate: deriveReferenceDate(now(), timeZone),
          userTimeZone: timeZone,
        },
        { signal: controller.signal },
      );
      if (
        !mountedRef.current ||
        !focusedRef.current ||
        !activeAppRef.current ||
        controller.signal.aborted ||
        generation !== generationRef.current
      ) {
        return false;
      }

      setWarnings(extraction.warnings.map((warning) => warning.message));
      setConfidence(extraction.confidence);
      if (!extraction.isActionable) {
        setPhase('no-actionable');
        return true;
      }

      setReviewValues(createEmailReviewValues(extraction.candidate));
      setPhase('review');
      return true;
    } catch (error) {
      if (
        error instanceof FinancialEmailRequestAbortedError ||
        controller.signal.aborted ||
        !mountedRef.current ||
        !focusedRef.current ||
        !activeAppRef.current ||
        generation !== generationRef.current
      ) {
        return false;
      }

      const normalized =
        error instanceof FinancialEmailClientError
          ? error
          : new FinancialEmailClientError(
              'unknown_error',
              true,
              'Email extraction could not be completed safely. Try again.',
            );
      setFailure({
        code: normalized.code,
        message: normalized.message,
        retryable: normalized.retryable,
      });
      if (normalized.code === 'rate_limited' && normalized.retryAfterSeconds) {
        beginRetryCountdown(normalized.retryAfterSeconds);
      }
      setPhase('extraction-failure');
      return false;
    } finally {
      if (generation === generationRef.current) {
        extractionPendingRef.current = false;
        controllerRef.current = null;
      }
    }
  }, [
    abortExtraction,
    beginRetryCountdown,
    now,
    parser,
    resolveTimeZone,
    stopRetryTimer,
  ]);

  const editEmail = useCallback(() => {
    abortExtraction();
    setFailure(null);
    setGuidance(null);
    setReviewValues(null);
    setReviewErrors({});
    setReviewValidationFocusRequest(0);
    setWarnings([]);
    setConfidence(null);
    setPhase('input');
  }, [abortExtraction]);

  const save = useCallback(async (): Promise<boolean> => {
    if (savePendingRef.current || !reviewValues || confidence === null) {
      return false;
    }
    const validation = validateEmailReview(reviewValues, confidence);
    if (!validation.ok) {
      setReviewErrors(validation.errors);
      setReviewValidationFocusRequest((current) => current + 1);
      setPhase('review');
      return false;
    }

    savePendingRef.current = true;
    const generation = generationRef.current;
    setReviewErrors({});
    setPhase('saving');
    try {
      const created = await createItem(validation.input);
      if (
        !created ||
        !mountedRef.current ||
        !focusedRef.current ||
        generation !== generationRef.current
      ) {
        if (
          mountedRef.current &&
          focusedRef.current &&
          generation === generationRef.current
        ) {
          setPhase('save-failure');
        }
        return false;
      }

      clearSensitiveState();
      return true;
    } catch {
      if (
        mountedRef.current &&
        focusedRef.current &&
        generation === generationRef.current
      ) {
        setPhase('save-failure');
      }
      return false;
    } finally {
      savePendingRef.current = false;
    }
  }, [clearSensitiveState, confidence, createItem, reviewValues]);

  return {
    clearSensitiveState,
    editEmail,
    emailCharacterCount: emailText.trim().length,
    emailLimit: EMAIL_LIMIT,
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
    subjectCharacterCount: subject.trim().length,
    subjectLimit: SUBJECT_LIMIT,
    updateReviewValue,
    warnings,
  };
}
