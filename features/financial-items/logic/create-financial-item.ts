import type { CreateFinancialItemInput } from '@/types/financial-item';

export function assertCreateFinancialItemProvenance(
  input: CreateFinancialItemInput,
): void {
  if (input.source === 'manual' && input.extractionConfidence === null) return;
  if (
    input.source === 'email' &&
    typeof input.extractionConfidence === 'number' &&
    Number.isFinite(input.extractionConfidence) &&
    input.extractionConfidence >= 0 &&
    input.extractionConfidence <= 1
  ) {
    return;
  }

  throw new TypeError('Invalid financial item creation provenance.');
}
