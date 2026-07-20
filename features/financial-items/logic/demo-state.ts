import { createDemoItems } from '@/constants/demo-data';
import type { FinancialItem } from '@/types/financial-item';

export type DemoSessionInteractionEvent =
  'meaningful-mutation-succeeded' | 'explicit-local-reset-succeeded';

type CanonicalFinancialItemFingerprint = readonly [
  FinancialItem['kind'],
  FinancialItem['title'],
  FinancialItem['provider'],
  FinancialItem['valueCents'],
  FinancialItem['chargeAmountCents'],
  FinancialItem['dueAt'],
  FinancialItem['recurrence'],
  FinancialItem['actionUrl'],
  FinancialItem['status'],
  FinancialItem['source'],
  FinancialItem['extractionConfidence'],
  boolean,
];

function fingerprint(item: FinancialItem): string {
  const fields: CanonicalFinancialItemFingerprint = [
    item.kind,
    item.title,
    item.provider,
    item.valueCents,
    item.chargeAmountCents,
    item.dueAt,
    item.recurrence,
    item.actionUrl,
    item.status,
    item.source,
    item.extractionConfidence,
    item.completedAt === null,
  ];

  return JSON.stringify(fields);
}

function sortedFingerprints(items: FinancialItem[]): string[] {
  return items
    .map(fingerprint)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}

export function isCanonicalDemoState(
  items: FinancialItem[],
  referenceDate: Date,
): boolean {
  const expectedItems = createDemoItems(referenceDate);
  if (items.length !== expectedItems.length) return false;

  const actualFingerprints = sortedFingerprints(items);
  const expectedFingerprints = sortedFingerprints(expectedItems);

  return actualFingerprints.every(
    (actualFingerprint, index) =>
      actualFingerprint === expectedFingerprints[index],
  );
}

export function nextDemoSessionInteractionState(
  hasMeaningfullyInteractedThisSession: boolean,
  event: DemoSessionInteractionEvent,
): boolean {
  if (event === 'explicit-local-reset-succeeded') return false;
  return (
    hasMeaningfullyInteractedThisSession ||
    event === 'meaningful-mutation-succeeded'
  );
}
