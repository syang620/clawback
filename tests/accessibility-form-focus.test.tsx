import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import {
  findFirstInvalidFinancialItemField,
  FinancialItemFields,
  type FinancialItemEditorValues,
} from '@/features/financial-items/components/financial-item-fields';
import type { ManualFinancialItemErrors } from '@/features/financial-items/logic/manual-entry';

const mockFocusAccessibilityTarget = jest.fn((_target: unknown) => true);

jest.mock('@/components/accessibility-focus', () => ({
  focusAccessibilityTarget: (target: unknown) =>
    mockFocusAccessibilityTarget(target),
}));

const values: FinancialItemEditorValues = {
  actionUrl: '',
  chargeAtRisk: '',
  deadline: '',
  kind: null,
  provider: '',
  recurrence: null,
  title: '',
  valueAvailable: '',
};

describe('Checkpoint 6C validation focus', () => {
  it('focuses the first invalid shared financial-item field for each request', () => {
    mockFocusAccessibilityTarget.mockClear();
    let renderer: ReactTestRenderer | null = null;
    let errors: ManualFinancialItemErrors = {};
    let validationFocusRequest = 0;

    const fields = () => (
      <FinancialItemFields
        errors={errors}
        onChange={jest.fn()}
        recurrenceRequired
        validationFocusRequest={validationFocusRequest}
        values={values}
      />
    );

    act(() => {
      renderer = create(fields(), {
        createNodeMock: () => ({ focus: jest.fn() }),
      });
    });

    const requestFocus = (nextErrors: ManualFinancialItemErrors) => {
      errors = nextErrors;
      validationFocusRequest += 1;
      act(() => renderer!.update(fields()));
    };

    requestFocus({ kind: 'Choose a task type.', title: 'Enter a title.' });
    expect(mockFocusAccessibilityTarget).toHaveBeenCalledTimes(1);
    expect(findFirstInvalidFinancialItemField(errors, values.kind)).toBe(
      'kind',
    );

    requestFocus({ title: 'Enter a title.' });
    expect(mockFocusAccessibilityTarget).toHaveBeenCalledTimes(2);
    expect(findFirstInvalidFinancialItemField(errors, values.kind)).toBe(
      'title',
    );

    requestFocus({ deadline: 'Enter a deadline.' });
    expect(mockFocusAccessibilityTarget).toHaveBeenCalledTimes(3);

    requestFocus({ chargeAtRisk: 'Enter a valid amount.' });
    expect(mockFocusAccessibilityTarget).toHaveBeenCalledTimes(4);

    requestFocus({ recurrence: 'Choose a recurrence.' });
    expect(mockFocusAccessibilityTarget).toHaveBeenCalledTimes(5);

    requestFocus({ actionUrl: 'Use a safe URL.' });
    expect(mockFocusAccessibilityTarget).toHaveBeenCalledTimes(6);
  });
});
