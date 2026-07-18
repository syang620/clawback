import { render, screen } from '@testing-library/react-native';

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { createDemoItems } from '@/constants/demo-data';
import { Dashboard } from '@/features/financial-items/components/dashboard';
import { FinancialItemCard } from '@/features/financial-items/components/financial-item-card';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  usePathname: () => '/',
}));

jest.mock('@/features/financial-items/components/swipe-to-strike', () => ({
  SwipeToStrike: ({
    children,
    onComplete,
  }: {
    children: (completeItem: (id: string) => boolean) => React.ReactNode;
    onComplete: (id: string) => boolean;
  }) => children(onComplete),
}));

describe('Milestone 01 components', () => {
  it('renders the dashboard empty state when no items are available', () => {
    render(
      <Dashboard
        items={[]}
        onComplete={jest.fn()}
        referenceDate={new Date('2026-07-16T00:00:00.000Z')}
      />,
    );

    expect(
      screen.getByText('Nothing is slipping through the cracks.'),
    ).toBeTruthy();
    expect(screen.getByLabelText('No active financial tasks')).toBeTruthy();
  });

  it('renders the minimal loading and error states', () => {
    const loading = render(<LoadingState />);
    expect(loading.getByLabelText('Loading financial tasks')).toBeTruthy();
    loading.unmount();

    render(<ErrorState />);
    expect(
      screen.getByLabelText('Could not load financial tasks'),
    ).toBeTruthy();
  });

  it('renders a financial item with a text-based next-deadline signal', () => {
    const item = createDemoItems(new Date('2026-07-16T00:00:00.000Z'))[0];
    render(
      <FinancialItemCard
        item={item}
        isNextDue
        onComplete={jest.fn()}
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
});
