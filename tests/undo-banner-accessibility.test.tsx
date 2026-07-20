import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { UndoBanner } from '@/components/undo-banner';
import { createDemoItems } from '@/constants/demo-data';

const mockAnnounce = jest.fn();
const mockFocusCurrentPageHeading = jest.fn(() => true);
const mockFocusAccessibilityTarget = jest.fn((_target: unknown) => true);
const mockDismissUndo = jest.fn();
const mockDismissMutationError = jest.fn();
const mockUndoLastCompletion = jest.fn<Promise<boolean>, []>();
let mockLastCompletion: {
  item: ReturnType<typeof createDemoItems>[number];
  token: number;
} | null = null;

jest.mock('@/components/accessibility-focus', () => ({
  focusAccessibilityTarget: (target: unknown) =>
    mockFocusAccessibilityTarget(target),
  useAccessibilityFocus: () => ({
    announce: mockAnnounce,
    focusCurrentPageHeading: mockFocusCurrentPageHeading,
    registerPageHeading: jest.fn(),
  }),
}));

jest.mock('@/features/financial-items/hooks/use-financial-items', () => ({
  useFinancialItems: () => ({
    dismissMutationError: mockDismissMutationError,
    dismissUndo: mockDismissUndo,
    lastCompletion: mockLastCompletion,
    mutationErrors: [],
    pendingItemOperations: {},
    undoLastCompletion: mockUndoLastCompletion,
  }),
}));

describe('Checkpoint 6C Undo focus and announcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLastCompletion = {
      item: createDemoItems(new Date('2026-07-19T12:00:00.000Z'))[0],
      token: 1,
    };
  });

  it('focuses a new Undo action, then announces and focuses the page after success', async () => {
    mockUndoLastCompletion.mockResolvedValue(true);
    render(<UndoBanner />);

    expect(mockFocusAccessibilityTarget).toHaveBeenCalledTimes(1);
    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', {
          name: /Undo completion of Cancel free trial/,
        }),
      );
      await Promise.resolve();
    });

    expect(mockAnnounce).toHaveBeenCalledWith(
      'Restored Cancel free trial to active tasks.',
    );
    expect(mockAnnounce).toHaveBeenCalledTimes(1);
    expect(mockFocusCurrentPageHeading).toHaveBeenCalledTimes(1);
  });

  it('does not move page focus after failed Undo, Dismiss, or expiry', async () => {
    mockUndoLastCompletion.mockResolvedValue(false);
    const view = render(<UndoBanner />);

    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', {
          name: /Undo completion of Cancel free trial/,
        }),
      );
      await Promise.resolve();
    });
    fireEvent.press(
      screen.getByRole('button', { name: 'Dismiss Undo message' }),
    );
    mockLastCompletion = null;
    view.rerender(<UndoBanner />);

    expect(mockDismissUndo).toHaveBeenCalledTimes(1);
    expect(mockAnnounce).not.toHaveBeenCalled();
    expect(mockFocusCurrentPageHeading).not.toHaveBeenCalled();
  });
});
