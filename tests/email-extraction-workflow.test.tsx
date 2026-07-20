import DateTimePicker from '@expo/ui/community/datetime-picker';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { AppState, Text } from 'react-native';

import {
  EmailExtractionUnavailable,
  EmailExtractionWorkflow,
} from '@/features/email-parser/components/email-extraction-workflow';
import {
  FinancialEmailClientError,
  type FinancialEmailClientErrorCode,
  type FinancialEmailExtraction,
  type FinancialEmailParser,
} from '@/features/email-parser/types';
import { useEmailExtractionWorkflow } from '@/features/email-parser/use-email-extraction-workflow';
import { calendarDateToLocalNoon } from '@/lib/dates';
import type {
  CreateFinancialItemInput,
  FinancialItem,
} from '@/types/financial-item';

const rawEmail =
  'Example renews for $0 on 2026-08-15. Manage it at https://example.com/account';
const fixedNow = () => new Date('2026-07-19T12:00:00.000Z');

function selectReviewDeadline(value: string) {
  const date = calendarDateToLocalNoon(value);
  if (!date) throw new Error(`Test deadline must be valid: ${value}`);

  fireEvent.press(screen.getByRole('button', { name: /Deadline, required/ }));
  const picker = screen.UNSAFE_getByType(DateTimePicker);
  act(() => {
    picker.props.onValueChange?.(
      {
        nativeEvent: {
          timestamp: date.getTime(),
          utcOffset: -date.getTimezoneOffset(),
        },
      },
      date,
    );
  });
  fireEvent.press(
    screen.getByRole('button', { name: 'Use selected deadline' }),
  );
}

const actionable = (
  title = 'Review Example renewal',
): FinancialEmailExtraction => ({
  isActionable: true,
  candidate: {
    merchantName: 'Example',
    title,
    kind: 'subscription',
    valueCents: null,
    chargeAmountCents: 0,
    deadlineDate: '2026-08-15',
    recurrence: null,
    actionUrl: 'https://example.com/account',
  },
  confidence: 0.72,
  warnings: [
    {
      code: 'low_confidence',
      field: 'recurrence',
      message: 'Choose whether this task repeats.',
    },
  ],
});

describe('Checkpoint 5B-2 email extraction workflow', () => {
  it('shows readable Local demo guidance without an unavailable control', () => {
    const onBack = jest.fn();
    render(<EmailExtractionUnavailable onBack={onBack} />);

    expect(
      screen.getByText(
        'Email extraction requires Connected mode. You can still add a task manually.',
      ),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Extract task' })).toBeNull();
    fireEvent.press(
      screen.getByRole('button', { name: 'Choose a manual task' }),
    );
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('validates input limits and exposes accessible character counts', async () => {
    const parser = parserResolving(actionable());
    const { capture } = renderWorkflow({ parser });

    fireEvent.press(screen.getByRole('button', { name: 'Extract task' }));
    expect(screen.getByText('Paste the email text to continue.')).toBeTruthy();
    expect(capture.current.inputValidationFocusRequest).toBe(1);

    fireEvent.changeText(
      screen.getByLabelText(/Email subject, optional/),
      's'.repeat(501),
    );
    fireEvent.changeText(
      screen.getByLabelText(/Email text, required/),
      'e'.repeat(20_001),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Extract task' }));

    expect(
      screen.getByLabelText('Subject: 501 of 500 characters'),
    ).toBeTruthy();
    expect(
      screen.getByLabelText('Email text: 20001 of 20000 characters'),
    ).toBeTruthy();
    expect(parser.extract).not.toHaveBeenCalled();
    expect(capture.current.inputValidationFocusRequest).toBe(2);
  });

  it('extracts, requires explicit recurrence, preserves zero, and saves email provenance', async () => {
    const parser = parserResolving(actionable());
    const createItem = jest.fn().mockResolvedValue({ id: 'created' });
    const onSaved = jest.fn();
    const { capture } = renderWorkflow({ createItem, onSaved, parser });

    enterEmail();
    fireEvent.press(screen.getByRole('button', { name: 'Extract task' }));
    expect(
      screen.getByRole('button', { name: 'Extracting…' }).props
        .accessibilityState,
    ).toMatchObject({ busy: true, disabled: true });
    await screen.findByText('Review extracted task');

    expect(screen.getByDisplayValue('0.00')).toBeTruthy();
    expect(screen.getByText('Aug 15, 2026')).toBeTruthy();
    expect(screen.getByText('Not specified')).toBeTruthy();
    expect(screen.getByText('Choose whether this task repeats.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Save task' }));
    expect(createItem).not.toHaveBeenCalled();
    expect(capture.current.reviewValidationFocusRequest).toBe(1);
    expect(
      screen.getByText('Choose a recurrence, including One time.'),
    ).toBeTruthy();

    fireEvent.press(screen.getByRole('radio', { name: 'One time' }));
    selectReviewDeadline('2026-08-31');
    fireEvent.changeText(
      screen.getByDisplayValue('Review Example renewal'),
      'Review edited renewal',
    );
    fireEvent.press(screen.getByRole('button', { name: 'Save task' }));
    expect(
      screen.getByRole('button', { name: 'Saving…' }).props.accessibilityState,
    ).toMatchObject({ busy: true, disabled: true });
    expect(
      screen.getByRole('button', { name: /Deadline, required/ }).props
        .accessibilityState,
    ).toMatchObject({ disabled: true });
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));

    expect(parser.extract).toHaveBeenCalledWith(
      {
        emailText: rawEmail,
        subject: 'Renewal reminder',
        referenceDate: '2026-07-19',
        userTimeZone: 'America/New_York',
      },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(createItem).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Review edited renewal',
        chargeAmountCents: 0,
        valueCents: null,
        recurrence: 'none',
        dueAt: '2026-08-31T12:00:00.000Z',
        source: 'email',
        extractionConfidence: 0.72,
      }),
    );
    expect(JSON.stringify(createItem.mock.calls)).not.toContain(rawEmail);
    expect(onSaved).toHaveBeenCalledWith();
    expect(capture.current.emailText).toBe('');
  });

  it('preserves the email and offers safe fallbacks for no actionable result', async () => {
    const parser = parserResolving({
      isActionable: false,
      candidate: null,
      confidence: 0.1,
      warnings: [],
    });
    const onManualFallback = jest.fn();
    const { capture } = renderWorkflow({ onManualFallback, parser });
    enterEmail();

    fireEvent.press(screen.getByRole('button', { name: 'Extract task' }));
    await screen.findByText('No clear financial task found');
    expect(capture.current.emailText).toBe(rawEmail);
    fireEvent.press(screen.getByRole('button', { name: 'Add manually' }));
    expect(onManualFallback).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(capture.current.emailText).toBe(''));
  });

  it.each<[FinancialEmailClientErrorCode, boolean]>([
    ['invalid_input', false],
    ['unauthorized', false],
    ['forbidden_origin', false],
    ['rate_limited', true],
    ['provider_timeout', true],
    ['provider_unavailable', true],
    ['refusal', false],
    ['incomplete_response', true],
    ['invalid_model_output', true],
    ['configuration_error', false],
    ['network_error', true],
    ['unknown_error', true],
  ])('preserves input for normalized %s failures', async (code, retryable) => {
    const parser: FinancialEmailParser = {
      extract: jest
        .fn()
        .mockRejectedValue(
          new FinancialEmailClientError(
            code,
            retryable,
            `Safe ${code} message.`,
            code === 'rate_limited' ? 60 : undefined,
          ),
        ),
    };
    const { capture, unmount } = renderWorkflow({ parser });
    enterEmail();

    fireEvent.press(screen.getByRole('button', { name: 'Extract task' }));
    await screen.findByText(`Safe ${code} message.`);
    expect(capture.current.emailText).toBe(rawEmail);
    expect(capture.current.subject).toBe('Renewal reminder');
    expect(capture.current.failure).toMatchObject({ code, retryable });
    unmount();
  });

  it('honors one rate-limit countdown without retrying automatically', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-19T12:00:00.000Z'));
    const intervalSpy = jest.spyOn(globalThis, 'setInterval');
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval');
    const parser: FinancialEmailParser = {
      extract: jest
        .fn()
        .mockRejectedValue(
          new FinancialEmailClientError(
            'rate_limited',
            true,
            'Wait before retrying.',
            2,
          ),
        ),
    };
    const { capture, unmount } = renderWorkflow({
      now: () => new Date(),
      parser,
    });
    enterEmail();
    fireEvent.press(screen.getByRole('button', { name: 'Extract task' }));
    await screen.findByText('Retry in 2s');

    expect(intervalSpy).toHaveBeenCalledTimes(1);
    expect(capture.current.emailText).toBe(rawEmail);
    act(() => jest.advanceTimersByTime(1_000));
    expect(screen.getByText('Retry in 1s')).toBeTruthy();
    act(() => jest.advanceTimersByTime(1_000));
    expect(screen.getByText('Retry extraction')).toBeTruthy();
    expect(parser.extract).toHaveBeenCalledTimes(1);

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    intervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
    jest.useRealTimers();
  });

  it('blocks duplicate requests and ignores a stale response after background abort', async () => {
    let appStateListener: ((state: 'active' | 'background') => void) | null =
      null;
    const appStateSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_type, listener) => {
        appStateListener = listener as typeof appStateListener;
        return { remove: jest.fn() };
      });
    const first = deferred<FinancialEmailExtraction>();
    const second = deferred<FinancialEmailExtraction>();
    const parser: FinancialEmailParser = {
      extract: jest
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
    };
    const { capture, unmount } = renderWorkflow({ parser });
    enterEmail();

    let firstRequest: Promise<boolean>;
    act(() => {
      firstRequest = capture.current.extract();
    });
    await act(async () => {
      await expect(capture.current.extract()).resolves.toBe(false);
    });
    expect(parser.extract).toHaveBeenCalledTimes(1);

    act(() => appStateListener?.('background'));
    expect(
      screen.getByText(
        'Extraction paused while the app was in the background. Your email is still here.',
      ),
    ).toBeTruthy();
    act(() => appStateListener?.('active'));
    let secondRequest: Promise<boolean>;
    act(() => {
      secondRequest = capture.current.extract();
    });
    await act(async () => {
      second.resolve(actionable('Newer candidate'));
      await secondRequest!;
    });
    expect(screen.getByDisplayValue('Newer candidate')).toBeTruthy();

    await act(async () => {
      first.resolve(actionable('Stale candidate'));
      await firstRequest!;
    });
    expect(screen.queryByDisplayValue('Stale candidate')).toBeNull();
    expect(screen.getByDisplayValue('Newer candidate')).toBeTruthy();
    unmount();
    appStateSpy.mockRestore();
  });

  it('aborts and clears sensitive state on cancel', async () => {
    const pending = deferred<FinancialEmailExtraction>();
    const capturedSignal = { current: null as AbortSignal | null };
    const parser: FinancialEmailParser = {
      extract: jest.fn((_input, options) => {
        capturedSignal.current = options?.signal ?? null;
        return pending.promise;
      }),
    };
    const onCancel = jest.fn();
    const rendered = renderWorkflow({ onCancel, parser });
    enterEmail();
    fireEvent.press(screen.getByRole('button', { name: 'Extract task' }));
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(capturedSignal.current?.aborted).toBe(true);
    expect(rendered.capture.current.emailText).toBe('');
    await act(async () => {
      pending.resolve(actionable());
      await Promise.resolve();
    });
    expect(rendered.capture.current.failure).toBeNull();
    rendered.unmount();
  });

  it('aborts, clears, and ignores late extraction on route blur and unmount', async () => {
    const pending = deferred<FinancialEmailExtraction>();
    const signals: AbortSignal[] = [];
    const parser: FinancialEmailParser = {
      extract: jest.fn((_input, options) => {
        if (options?.signal) signals.push(options.signal);
        return pending.promise;
      }),
    };
    const rendered = renderWorkflow({ parser });
    enterEmail();
    fireEvent.press(screen.getByRole('button', { name: 'Extract task' }));
    rendered.rerender(
      <Harness
        capture={rendered.capture}
        createItem={rendered.createItem}
        isFocused={false}
        onCancel={rendered.onCancel}
        onManualFallback={rendered.onManualFallback}
        now={rendered.now}
        onSaved={rendered.onSaved}
        parser={parser}
      />,
    );
    expect(signals[0]?.aborted).toBe(true);
    expect(rendered.capture.current.emailText).toBe('');
    await act(async () => {
      pending.resolve(actionable('Late after blur'));
      await Promise.resolve();
    });
    expect(screen.queryByDisplayValue('Late after blur')).toBeNull();
    rendered.unmount();

    const unmountPending = deferred<FinancialEmailExtraction>();
    const unmountSignals: AbortSignal[] = [];
    const unmountParser: FinancialEmailParser = {
      extract: jest.fn((_input, options) => {
        if (options?.signal) unmountSignals.push(options.signal);
        return unmountPending.promise;
      }),
    };
    const unmountRendered = renderWorkflow({ parser: unmountParser });
    enterEmail();
    fireEvent.press(screen.getByRole('button', { name: 'Extract task' }));
    unmountRendered.unmount();
    expect(unmountSignals[0]?.aborted).toBe(true);
    unmountPending.resolve(actionable('Late after unmount'));
  });

  it('uses a synchronous save guard to prevent duplicate persistence', async () => {
    const persistence = deferred<FinancialItem | null>();
    const createItem = jest.fn().mockReturnValue(persistence.promise);
    const { capture } = renderWorkflow({
      createItem,
      parser: parserResolving(actionable()),
    });
    enterEmail();
    fireEvent.press(screen.getByRole('button', { name: 'Extract task' }));
    await screen.findByText('Review extracted task');
    fireEvent.press(screen.getByRole('radio', { name: 'One time' }));

    let firstSave: Promise<boolean>;
    let secondSave: Promise<boolean>;
    act(() => {
      firstSave = capture.current.save();
      secondSave = capture.current.save();
    });
    await expect(secondSave!).resolves.toBe(false);
    expect(createItem).toHaveBeenCalledTimes(1);
    await act(async () => {
      persistence.resolve({ id: 'created' } as FinancialItem);
      await expect(firstSave!).resolves.toBe(true);
    });
    expect(createItem).toHaveBeenCalledTimes(1);
  });

  it('retains review edits after failed persistence and navigates only after success', async () => {
    const createItem = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'created' });
    const onSaved = jest.fn();
    const parser = parserResolving(actionable());
    renderWorkflow({ createItem, onSaved, parser });
    enterEmail();
    fireEvent.press(screen.getByRole('button', { name: 'Extract task' }));
    await screen.findByText('Review extracted task');
    fireEvent.press(screen.getByRole('radio', { name: 'One time' }));
    fireEvent.changeText(
      screen.getByDisplayValue('Review Example renewal'),
      'Keep my reviewed edit',
    );

    fireEvent.press(screen.getByRole('button', { name: 'Save task' }));
    await screen.findByText(
      'We could not save this task. Your review edits are still here. Try Save again.',
    );
    expect(screen.getByDisplayValue('Keep my reviewed edit')).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
    expect(parser.extract).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByRole('button', { name: 'Save task' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(parser.extract).toHaveBeenCalledTimes(1);
    expect(createItem).toHaveBeenCalledTimes(2);
  });
});

type Workflow = ReturnType<typeof useEmailExtractionWorkflow>;

function Harness({
  capture,
  createItem,
  isFocused,
  now,
  onCancel,
  onManualFallback,
  onSaved,
  parser,
}: {
  capture: { current: Workflow };
  createItem: jest.Mock;
  isFocused: boolean;
  now: () => Date;
  onCancel: jest.Mock;
  onManualFallback: jest.Mock;
  onSaved: jest.Mock;
  parser: FinancialEmailParser;
}) {
  const workflow = useEmailExtractionWorkflow({
    createItem: createItem as (
      input: CreateFinancialItemInput,
    ) => Promise<FinancialItem | null>,
    isFocused,
    now,
    parser,
    resolveTimeZone: () => 'America/New_York',
  });
  capture.current = workflow;
  return (
    <>
      <Text>{`Phase ${workflow.phase}`}</Text>
      <EmailExtractionWorkflow
        onCancel={onCancel}
        onManualFallback={onManualFallback}
        onSaved={onSaved}
        workflow={workflow}
      />
    </>
  );
}

function renderWorkflow({
  createItem = jest.fn().mockResolvedValue({ id: 'created' }),
  isFocused = true,
  now = fixedNow,
  onCancel = jest.fn(),
  onManualFallback = jest.fn(),
  onSaved = jest.fn(),
  parser,
}: {
  createItem?: jest.Mock;
  isFocused?: boolean;
  now?: () => Date;
  onCancel?: jest.Mock;
  onManualFallback?: jest.Mock;
  onSaved?: jest.Mock;
  parser: FinancialEmailParser;
}) {
  const capture = { current: undefined as unknown as Workflow };
  const view = render(
    <Harness
      capture={capture}
      createItem={createItem}
      isFocused={isFocused}
      now={now}
      onCancel={onCancel}
      onManualFallback={onManualFallback}
      onSaved={onSaved}
      parser={parser}
    />,
  );
  return {
    ...view,
    capture,
    createItem,
    onCancel,
    onManualFallback,
    now,
    onSaved,
  };
}

function enterEmail() {
  fireEvent.changeText(
    screen.getByLabelText(/Email subject, optional/),
    'Renewal reminder',
  );
  fireEvent.changeText(screen.getByLabelText(/Email text, required/), rawEmail);
}

function parserResolving(
  extraction: FinancialEmailExtraction,
): FinancialEmailParser & { extract: jest.Mock } {
  return { extract: jest.fn().mockResolvedValue(extraction) };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}
