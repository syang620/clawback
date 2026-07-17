export function formatMoney(valueCents: number | null): string {
  if (valueCents === null) return 'Not specified';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: valueCents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: valueCents % 100 === 0 ? 0 : 2,
  }).format(valueCents / 100);
}
