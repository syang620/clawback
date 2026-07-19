import {
  InvalidEmailExtractionEnvelopeError,
  parseFinancialEmailExtractionEnvelope,
  parseFinancialEmailFailureEnvelope,
} from '@/services/email-parser/validation';

const emailText =
  'Your plan renews for $0 on 2026-08-15. Manage it at https://example.com/account';

const candidate = {
  merchantName: 'Example',
  title: 'Review plan renewal',
  kind: 'subscription',
  valueCents: null,
  chargeAmountCents: 0,
  deadlineDate: '2026-08-15',
  recurrence: null,
  actionUrl: 'https://example.com/account',
};

describe('financial email response validation', () => {
  it('accepts an actionable result while preserving null and explicit zero', () => {
    expect(
      parseFinancialEmailExtractionEnvelope(
        {
          ok: true,
          extraction: {
            isActionable: true,
            candidate,
            confidence: 0.7,
            warnings: [
              {
                code: 'low_confidence',
                field: 'general',
                message: 'Review carefully.',
              },
            ],
          },
        },
        emailText,
      ),
    ).toMatchObject({
      isActionable: true,
      candidate: { valueCents: null, chargeAmountCents: 0 },
    });
  });

  it('enforces the actionable candidate invariant', () => {
    expect(() =>
      parseFinancialEmailExtractionEnvelope(
        {
          ok: true,
          extraction: {
            isActionable: false,
            candidate,
            confidence: 0.2,
            warnings: [],
          },
        },
        emailText,
      ),
    ).toThrow(InvalidEmailExtractionEnvelopeError);
    expect(() =>
      parseFinancialEmailExtractionEnvelope(
        {
          ok: true,
          extraction: {
            isActionable: true,
            candidate: null,
            confidence: 0.2,
            warnings: [],
          },
        },
        emailText,
      ),
    ).toThrow(InvalidEmailExtractionEnvelopeError);
  });

  it('accepts a no-action result without fabricating a candidate', () => {
    expect(
      parseFinancialEmailExtractionEnvelope(
        {
          ok: true,
          extraction: {
            isActionable: false,
            candidate: null,
            confidence: 0.1,
            warnings: [],
          },
        },
        emailText,
      ),
    ).toEqual({
      isActionable: false,
      candidate: null,
      confidence: 0.1,
      warnings: [],
    });
  });

  it.each([
    { ...candidate, chargeAmountCents: -1 },
    { ...candidate, chargeAmountCents: 1.2 },
    { ...candidate, deadlineDate: '2026-02-30' },
    { ...candidate, actionUrl: 'http://example.com/account' },
    { ...candidate, actionUrl: 'https://not-in-email.example/account' },
    { ...candidate, unexpected: true },
  ])('rejects an unsafe or malformed candidate %#', (invalidCandidate) => {
    expect(() =>
      parseFinancialEmailExtractionEnvelope(
        {
          ok: true,
          extraction: {
            isActionable: true,
            candidate: invalidCandidate,
            confidence: 0.7,
            warnings: [],
          },
        },
        emailText,
      ),
    ).toThrow(InvalidEmailExtractionEnvelopeError);
  });

  it('strictly parses the safe server failure envelope', () => {
    expect(
      parseFinancialEmailFailureEnvelope({
        ok: false,
        error: {
          code: 'rate_limited',
          message: 'Safe message.',
          retryable: true,
        },
      }),
    ).toEqual({ code: 'rate_limited', retryable: true });
    expect(() =>
      parseFinancialEmailFailureEnvelope({
        ok: false,
        error: {
          code: 'rate_limited',
          message: 'Safe message.',
          retryable: true,
          raw: 'private',
        },
      }),
    ).toThrow(InvalidEmailExtractionEnvelopeError);
  });
});
