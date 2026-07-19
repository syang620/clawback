import {
  createEmailReviewValues,
  validateEmailReview,
} from '@/features/email-parser/review';

describe('Checkpoint 5B-2 extraction review logic', () => {
  it('preserves candidate nulls as blank and explicit zero as 0.00', () => {
    expect(
      createEmailReviewValues({
        merchantName: null,
        title: null,
        kind: null,
        valueCents: null,
        chargeAmountCents: 0,
        deadlineDate: null,
        recurrence: null,
        actionUrl: null,
      }),
    ).toEqual({
      kind: null,
      title: '',
      provider: '',
      valueAvailable: '',
      chargeAtRisk: '0.00',
      deadline: '',
      recurrence: null,
      actionUrl: '',
    });
  });

  it('requires explicit kind, title, deadline, and recurrence choices', () => {
    const result = validateEmailReview(
      {
        kind: null,
        title: '',
        provider: '',
        valueAvailable: '',
        chargeAtRisk: '',
        deadline: '',
        recurrence: null,
        actionUrl: '',
      },
      0.5,
    );

    expect(result).toEqual({
      ok: false,
      errors: {
        kind: 'Choose a task type.',
        title: 'Enter a title.',
        deadline: 'Enter a deadline.',
        recurrence: 'Choose a recurrence, including One time.',
      },
    });
  });

  it('reuses deterministic date, money, and HTTPS validation', () => {
    const result = validateEmailReview(
      {
        kind: 'trial',
        title: 'Review trial',
        provider: 'Example',
        valueAvailable: '-1',
        chargeAtRisk: '12.345',
        deadline: '2026-02-30',
        recurrence: 'none',
        actionUrl: 'http://example.com',
      },
      0.5,
    );

    expect(result).toMatchObject({
      ok: false,
      errors: {
        valueAvailable: expect.any(String),
        chargeAtRisk: expect.any(String),
        deadline: expect.any(String),
        actionUrl: expect.any(String),
      },
    });
  });

  it('creates only email provenance with validated confidence', () => {
    expect(
      validateEmailReview(
        {
          kind: 'subscription',
          title: 'Review renewal',
          provider: 'Example',
          valueAvailable: '',
          chargeAtRisk: '0.00',
          deadline: '2026-08-15',
          recurrence: 'none',
          actionUrl: 'https://example.com/account',
        },
        0.72,
      ),
    ).toEqual({
      ok: true,
      input: {
        kind: 'subscription',
        title: 'Review renewal',
        provider: 'Example',
        valueCents: null,
        chargeAmountCents: 0,
        dueAt: '2026-08-15T12:00:00.000Z',
        recurrence: 'none',
        actionUrl: 'https://example.com/account',
        source: 'email',
        extractionConfidence: 0.72,
      },
    });
  });
});
