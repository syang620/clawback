import { fireEvent, render, screen } from '@testing-library/react-native';

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { createDemoItems } from '@/constants/demo-data';
import { Dashboard } from '@/features/financial-items/components/dashboard';
import { FinancialItemCard } from '@/features/financial-items/components/financial-item-card';

const mockLink = jest.fn(
  ({ children }: { children: React.ReactNode }) => children,
);

jest.mock('expo-router', () => ({
  Link: (props: { children: React.ReactNode }) => mockLink(props),
  usePathname: () => '/',
}));

jest.mock('@/features/financial-items/components/swipe-to-strike', () => ({
  SwipeToStrike: ({
    children,
    onComplete,
  }: {
    children: (
      completeItem: (id: string) => Promise<boolean>,
    ) => React.ReactNode;
    onComplete: (id: string) => Promise<boolean>;
  }) => children(onComplete),
}));

jest.mock('@/features/financial-items/hooks/use-financial-items', () => ({
  useFinancialItems: () => ({ mode: 'demo' }),
}));

describe('Milestone 01 components', () => {
  it('renders the dashboard empty state when no items are available', () => {
    render(
      <Dashboard
        items={[]}
        onComplete={jest.fn().mockResolvedValue(true)}
        referenceDate={new Date('2026-07-16T00:00:00.000Z')}
      />,
    );

    expect(screen.getByText('No active financial tasks remain.')).toBeTruthy();
    expect(screen.getByLabelText('No active financial tasks')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Add a financial task' }),
    ).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'View Activity' })).toBeNull();
  });

  it('shows one accessible secondary Add link for a pristine demo', () => {
    const items = createDemoItems(new Date('2026-07-16T00:00:00.000Z'));
    render(
      <Dashboard
        items={items}
        onComplete={jest.fn().mockResolvedValue(true)}
        referenceDate={new Date('2026-07-16T00:00:00.000Z')}
        showPristineIntro
      />,
    );

    expect(
      screen.getByRole('header', {
        name: 'Catch deadlines before money slips away',
      }),
    ).toBeTruthy();
    expect(screen.getByText(/does not cancel or redeem for you/)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Add a financial task' }),
    ).toBeTruthy();
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({ href: '/add' }),
    );
  });

  it('renders the minimal loading and error states', () => {
    const loading = render(<LoadingState />);
    expect(
      loading.getByLabelText('Loading your financial tasks…'),
    ).toBeTruthy();
    loading.unmount();

    const retry = jest.fn();
    render(<ErrorState onRetry={retry} />);
    expect(
      screen.getByRole('header', { name: 'Could not load tasks' }),
    ).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(
      screen.getByText(
        'Please try again. Your information has not been changed.',
      ),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('renders a financial item with a text-based next-deadline signal', () => {
    const item = createDemoItems(new Date('2026-07-16T00:00:00.000Z'))[0];
    render(
      <FinancialItemCard
        item={item}
        isNextDue
        onComplete={jest.fn().mockResolvedValue(true)}
        referenceDate={new Date('2026-07-16T00:00:00.000Z')}
      />,
    );

    expect(screen.getByText('FoundersCard')).toBeTruthy();
    expect(screen.getByText('Next deadline')).toBeTruthy();
    expect(screen.getByText('Soon')).toBeTruthy();
    expect(screen.getByText('Due in 3 days')).toBeTruthy();
    expect(screen.getByText('Jul 19, 2026')).toBeTruthy();
    expect(screen.getByText('$595')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Complete Cancel free trial' }),
    ).toBeTruthy();
  });

  it('renders Next deadline on every active task tied for earliest', () => {
    const referenceDate = new Date('2026-07-16T00:00:00.000Z');
    const items = createDemoItems(referenceDate);
    const tiedItems = [
      items[0],
      { ...items[1], dueAt: items[0].dueAt },
      items[2],
    ];

    render(
      <Dashboard
        items={tiedItems}
        onComplete={jest.fn().mockResolvedValue(true)}
        referenceDate={referenceDate}
      />,
    );

    expect(screen.getAllByText('Next deadline')).toHaveLength(2);
  });
});
