export function formatMoney(valueCents: number | null): string {
  if (valueCents === null) return 'Not specified';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: valueCents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: valueCents % 100 === 0 ? 0 : 2,
  }).format(valueCents / 100);
}

export type DollarInputResult =
  | { ok: true; valueCents: number | null }
  | { ok: false; reason: 'invalid' | 'too-large' };

export function parseDollarInput(value: string): DollarInputResult {
  const trimmed = value.trim();
  if (trimmed === '') return { ok: true, valueCents: null };

  const withoutSymbol = trimmed.startsWith('$') ? trimmed.slice(1) : trimmed;
  const match = withoutSymbol.match(
    /^((?:\d{1,3}(?:,\d{3})+)|\d+)?(?:\.(\d{1,2}))?$/,
  );

  if (!match || (!match[1] && !match[2])) {
    return { ok: false, reason: 'invalid' };
  }

  const wholeDigits = (match[1] ?? '0').replaceAll(',', '');
  const fractionalDigits = (match[2] ?? '').padEnd(2, '0');
  const valueCents =
    Number(wholeDigits) * 100 + Number(fractionalDigits || '0');

  if (!Number.isSafeInteger(valueCents)) {
    return { ok: false, reason: 'too-large' };
  }

  return { ok: true, valueCents };
}
