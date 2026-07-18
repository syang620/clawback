import { createDemoItems } from '@/constants/demo-data';
import {
  completeFinancialItem,
  restoreFinancialItem,
} from '@/features/financial-items/logic/status-transitions';

describe('Milestone 02 status transitions', () => {
  const item = createDemoItems(new Date('2026-07-16T00:00:00.000Z'))[0];
  const completedAt = new Date('2026-07-17T12:00:00.000Z');
  const restoredAt = new Date('2026-07-18T12:00:00.000Z');

  it('completes an active item with explicit timestamps', () => {
    expect(completeFinancialItem(item, completedAt)).toMatchObject({
      status: 'completed',
      completedAt: completedAt.toISOString(),
      updatedAt: completedAt.toISOString(),
    });
  });

  it('restores a completed item and clears its completion time', () => {
    const completed = completeFinancialItem(item, completedAt);
    expect(restoreFinancialItem(completed, restoredAt)).toMatchObject({
      status: 'active',
      completedAt: null,
      updatedAt: restoredAt.toISOString(),
    });
  });

  it('does not apply invalid transitions', () => {
    const completed = completeFinancialItem(item, completedAt);
    expect(completeFinancialItem(completed, restoredAt)).toBe(completed);
    expect(restoreFinancialItem(item, restoredAt)).toBe(item);
  });

  it('rejects invalid transition dates when a transition applies', () => {
    expect(() => completeFinancialItem(item, new Date('invalid'))).toThrow(
      RangeError,
    );
  });
});
