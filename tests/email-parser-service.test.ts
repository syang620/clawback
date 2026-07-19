import type { SupabaseClient } from '@supabase/supabase-js';

jest.mock('@/lib/supabase/client', () => ({ getSupabaseClient: jest.fn() }));
jest.mock('@/lib/supabase/environment', () => ({
  resolveSupabaseEnvironment: jest.fn(),
}));

import {
  FinancialEmailClientError,
  FinancialEmailRequestAbortedError,
  type ParseFinancialEmailInput,
} from '@/features/email-parser/types';
import { SupabaseFinancialEmailParser } from '@/services/email-parser/service';
import type { Database } from '@/types/database';

const input: ParseFinancialEmailInput = {
  emailText:
    ' Your renewal is due at https://example.com/account on August 15. ',
  subject: ' Renewal notice ',
  referenceDate: '2026-07-19',
  userTimeZone: 'America/New_York',
};

const extraction = {
  ok: true,
  extraction: {
    isActionable: true,
    candidate: {
      merchantName: 'Example',
      title: 'Review renewal',
      kind: 'subscription',
      valueCents: null,
      chargeAmountCents: 12345,
      deadlineDate: '2026-08-15',
      recurrence: 'annual',
      actionUrl: 'https://example.com/account',
    },
    confidence: 0.8,
    warnings: [],
  },
};

describe('Supabase financial email parser', () => {
  it('sends only the normalized provider-neutral request and validates success', async () => {
    const invoke = jest
      .fn()
      .mockResolvedValue({ data: extraction, error: null });
    const parser = new SupabaseFinancialEmailParser(asClient(invoke));

    await expect(parser.extract(input)).resolves.toMatchObject({
      isActionable: true,
      candidate: { chargeAmountCents: 12345 },
    });
    expect(invoke).toHaveBeenCalledWith('parse-financial-email', {
      body: {
        emailText:
          'Your renewal is due at https://example.com/account on August 15.',
        subject: 'Renewal notice',
        referenceDate: '2026-07-19',
        userTimeZone: 'America/New_York',
      },
      signal: undefined,
      timeout: 65_000,
    });
  });

  it.each([
    ['authentication', 'unauthorized'],
    ['origin_forbidden', 'forbidden_origin'],
    ['rate_limited', 'rate_limited'],
    ['timeout', 'provider_timeout'],
    ['provider_unavailable', 'provider_unavailable'],
    ['provider_refused', 'refusal'],
    ['provider_incomplete', 'incomplete_response'],
    ['provider_invalid_response', 'invalid_model_output'],
    ['configuration', 'configuration_error'],
    ['invalid_request', 'invalid_input'],
    ['method_not_allowed', 'unknown_error'],
    ['future_server_code', 'unknown_error'],
  ])(
    'maps %s to the stable %s client error',
    async (serverCode, clientCode) => {
      const parser = new SupabaseFinancialEmailParser(
        asClient(
          jest.fn().mockResolvedValue({
            data: null,
            error: responseError(serverCode, true),
          }),
        ),
      );

      const error = await captureError(parser.extract(input));
      expect(error).toBeInstanceOf(FinancialEmailClientError);
      expect(error).toMatchObject({ code: clientCode });
      expect((error as Error).message).not.toContain('private provider detail');
    },
  );

  it('honors a valid Retry-After delay and safely defaults an invalid value', async () => {
    const withDelay = new SupabaseFinancialEmailParser(
      asClient(
        jest.fn().mockResolvedValue({
          data: null,
          error: responseError('rate_limited', true, '47'),
        }),
      ),
    );
    const defaultDelay = new SupabaseFinancialEmailParser(
      asClient(
        jest.fn().mockResolvedValue({
          data: null,
          error: responseError('rate_limited', true, 'private'),
        }),
      ),
    );

    await expect(captureError(withDelay.extract(input))).resolves.toMatchObject(
      {
        code: 'rate_limited',
        retryAfterSeconds: 47,
      },
    );
    await expect(
      captureError(defaultDelay.extract(input)),
    ).resolves.toMatchObject({
      code: 'rate_limited',
      retryAfterSeconds: 60,
    });
  });

  it.each([
    [{ ...input, emailText: '   ' }, 'invalid_input'],
    [{ ...input, emailText: 'x'.repeat(20_001) }, 'invalid_input'],
    [{ ...input, subject: 'x'.repeat(501) }, 'invalid_input'],
    [{ ...input, referenceDate: '2026-02-30' }, 'configuration_error'],
    [{ ...input, userTimeZone: 'Not/A_Zone' }, 'configuration_error'],
  ])(
    'rejects invalid client input before invocation %#',
    async (badInput, code) => {
      const invoke = jest.fn();
      const parser = new SupabaseFinancialEmailParser(asClient(invoke));

      await expect(
        captureError(parser.extract(badInput)),
      ).resolves.toMatchObject({
        code,
      });
      expect(invoke).not.toHaveBeenCalled();
    },
  );

  it('normalizes transport failures without exposing backend details', async () => {
    const returnedError = new SupabaseFinancialEmailParser(
      asClient(
        jest.fn().mockResolvedValue({
          data: null,
          error: new Error('postgresql://private-host'),
        }),
      ),
    );
    const rejectedError = new SupabaseFinancialEmailParser(
      asClient(jest.fn().mockRejectedValue(new Error('secret stack'))),
    );

    for (const parser of [returnedError, rejectedError]) {
      const error = await captureError(parser.extract(input));
      expect(error).toMatchObject({ code: 'network_error', retryable: true });
      expect((error as Error).message).not.toMatch(/private|secret|postgres/i);
    }
  });

  it('treats explicit aborts as lifecycle events rather than failures', async () => {
    const controller = new AbortController();
    controller.abort();
    const invoke = jest.fn();
    const parser = new SupabaseFinancialEmailParser(asClient(invoke));

    await expect(
      parser.extract(input, { signal: controller.signal }),
    ).rejects.toBeInstanceOf(FinancialEmailRequestAbortedError);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('ignores a successful late response after the request is aborted', async () => {
    const deferred = createDeferred<{ data: unknown; error: null }>();
    const parser = new SupabaseFinancialEmailParser(
      asClient(jest.fn().mockReturnValue(deferred.promise)),
    );
    const controller = new AbortController();
    const request = parser.extract(input, { signal: controller.signal });

    controller.abort();
    deferred.resolve({ data: extraction, error: null });
    await expect(request).rejects.toBeInstanceOf(
      FinancialEmailRequestAbortedError,
    );
  });

  it('rejects unusable successful responses with a safe unknown error', async () => {
    const parser = new SupabaseFinancialEmailParser(
      asClient(
        jest.fn().mockResolvedValue({
          data: { ok: true, extraction: { raw: 'private model output' } },
          error: null,
        }),
      ),
    );

    const error = await captureError(parser.extract(input));
    expect(error).toMatchObject({ code: 'unknown_error' });
    expect((error as Error).message).not.toContain('private model output');
  });
});

function asClient(invoke: jest.Mock): SupabaseClient<Database> {
  return { functions: { invoke } } as unknown as SupabaseClient<Database>;
}

function responseError(code: string, retryable: boolean, retryAfter?: string) {
  const headers = new Headers();
  if (retryAfter) headers.set('Retry-After', retryAfter);
  return {
    context: new Response(
      JSON.stringify({
        ok: false,
        error: { code, message: 'private provider detail', retryable },
      }),
      { status: 400, headers },
    ),
  };
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}
