import { act, fireEvent, render, screen } from '@testing-library/react-native';

import AddRoute from '@/app/add';

const mockReplace = jest.fn();
const mockResetLocalDemo = jest.fn().mockResolvedValue(true);
let mockIsCreating = false;
let mockPendingItemOperations: Record<string, 'complete' | 'restore'> = {};

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  usePathname: () => '/add',
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
  }),
}));

jest.mock('@/features/financial-items/hooks/use-financial-items', () => ({
  useFinancialItems: () => ({
    initialization: { phase: 'ready' },
    isCreating: mockIsCreating,
    isResettingLocalDemo: false,
    mode: 'demo',
    pendingItemOperations: mockPendingItemOperations,
    resetLocalDemo: mockResetLocalDemo,
  }),
}));

describe('Checkpoint 6B Add route reset navigation', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockResetLocalDemo.mockClear();
    mockResetLocalDemo.mockResolvedValue(true);
    mockIsCreating = false;
    mockPendingItemOperations = {};
  });

  it('returns Home after a confirmed successful reset without reloading', async () => {
    render(<AddRoute />);

    fireEvent.press(screen.getByRole('button', { name: 'Reset Local demo' }));
    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', { name: 'Confirm Local demo reset' }),
      );
      await Promise.resolve();
    });

    expect(mockResetLocalDemo).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('does not navigate Home when replacement fails', async () => {
    mockResetLocalDemo.mockResolvedValueOnce(false);
    render(<AddRoute />);

    fireEvent.press(screen.getByRole('button', { name: 'Reset Local demo' }));
    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', { name: 'Confirm Local demo reset' }),
      );
      await Promise.resolve();
    });

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText(/Nothing was replaced/)).toBeTruthy();
  });

  it('disables reset while a known create or item mutation is pending', () => {
    mockIsCreating = true;
    const view = render(<AddRoute />);
    expect(
      screen.getByRole('button', { name: 'Reset Local demo' }).props
        .accessibilityState,
    ).toMatchObject({ disabled: true });

    mockIsCreating = false;
    mockPendingItemOperations = { 'task-1': 'restore' };
    view.rerender(<AddRoute />);
    const reset = screen.getByRole('button', { name: 'Reset Local demo' });
    expect(reset.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(reset);
    expect(mockResetLocalDemo).not.toHaveBeenCalled();
  });
});
