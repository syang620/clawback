import { fireEvent, render, screen } from '@testing-library/react-native';

import FinancialItemDetailRoute from '@/app/item/[id]';
import { createDemoItems } from '@/constants/demo-data';

const mockReplace = jest.fn();
const mockGetItem = jest.fn();

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useIsFocused: () => true,
  useLocalSearchParams: () => ({ id: 'founderscard-trial' }),
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/components/app-header', () => ({
  AppHeader: () => null,
}));

jest.mock(
  '@/features/financial-items/hooks/use-complete-with-feedback',
  () => ({
    useCompleteWithFeedback: () => jest.fn().mockResolvedValue(true),
  }),
);

jest.mock('@/features/financial-items/hooks/use-financial-items', () => ({
  useFinancialItems: () => ({
    dismissMutationError: jest.fn(),
    getItem: mockGetItem,
    mode: 'demo',
    mutationErrors: [],
    pendingItemOperations: {},
  }),
}));

describe('Financial task detail route navigation', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockGetItem.mockReturnValue(
      createDemoItems(new Date('2026-07-19T12:00:00.000Z'))[0],
    );
  });

  it('returns Home directly without relying on navigation history', () => {
    render(<FinancialItemDetailRoute />);

    fireEvent.press(screen.getAllByRole('link', { name: 'Return Home' })[0]);

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('keeps the missing-task recovery action functional', () => {
    mockGetItem.mockReturnValue(null);
    render(<FinancialItemDetailRoute />);

    const returnHomeButtons = screen.getAllByRole('link', {
      name: 'Return Home',
    });
    fireEvent.press(returnHomeButtons[returnHomeButtons.length - 1]);

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
