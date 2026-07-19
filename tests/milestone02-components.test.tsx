import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { createDemoItems } from '@/constants/demo-data';
import { Activity } from '@/features/financial-items/components/activity';
import { FinancialItemDetail } from '@/features/financial-items/components/financial-item-detail';
import { completeFinancialItem } from '@/features/financial-items/logic/status-transitions';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  usePathname: () => '/activity',
}));

jest.mock('@/features/financial-items/hooks/use-financial-items', () => ({
  useFinancialItems: () => ({ mode: 'demo' }),
}));

describe('Milestone 02 route components', () => {
  const referenceDate = new Date('2026-07-16T00:00:00.000Z');
  const items = createDemoItems(referenceDate);

  it('renders the Activity empty state and a completed task', () => {
    const emptyActivity = render(<Activity items={items} />);
    expect(
      emptyActivity.getByText('Your first strike will show up here.'),
    ).toBeTruthy();
    emptyActivity.unmount();

    const completed = completeFinancialItem(
      items[1],
      new Date('2026-07-17T12:00:00.000Z'),
    );
    render(<Activity items={[completed]} />);

    expect(screen.getByText("Use monthly Dunkin' credit")).toBeTruthy();
    expect(screen.getByText('$7')).toBeTruthy();
    expect(screen.getByText('Completed Jul 17, 2026')).toBeTruthy();
  });

  it('shows an explicit safe action and completion control on details', () => {
    const onComplete = jest.fn().mockResolvedValue(true);
    const openUrl = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValueOnce(undefined);
    render(
      <FinancialItemDetail
        item={items[0]}
        onComplete={onComplete}
        referenceDate={referenceDate}
      />,
    );

    expect(screen.getByText('Soon')).toBeTruthy();
    expect(screen.getByText('Due in 3 days')).toBeTruthy();
    expect(screen.getByText('founderscard.com')).toBeTruthy();

    fireEvent.press(screen.getByText('Open action page'));
    fireEvent.press(screen.getByText('Complete'));

    expect(openUrl).toHaveBeenCalledWith('https://founderscard.com/');
    expect(onComplete).toHaveBeenCalledWith('founderscard-trial');
    openUrl.mockRestore();
  });
});
