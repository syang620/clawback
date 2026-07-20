import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { createDemoItems } from '@/constants/demo-data';
import { Activity } from '@/features/financial-items/components/activity';
import { FinancialItemDetail } from '@/features/financial-items/components/financial-item-detail';
import { completeFinancialItem } from '@/features/financial-items/logic/status-transitions';

const mockLink = jest.fn(
  ({ children }: { children: React.ReactNode }) => children,
);

jest.mock('expo-router', () => ({
  Link: (props: { children: React.ReactNode }) => mockLink(props),
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
    expect(
      emptyActivity.getByRole('link', { name: 'Return Home' }),
    ).toBeTruthy();
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({ href: '/' }),
    );
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

  it('shows an explicit safe action and completion control on details', async () => {
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
    expect(
      screen.getByText(/founderscard\.com · External website/),
    ).toBeTruthy();
    expect(screen.getByText('Next action')).toBeTruthy();
    expect(
      screen.getByText(
        'Open the provider’s website, then mark this task complete.',
      ),
    ).toBeTruthy();
    const actionControls = screen.getByLabelText('Next action controls');
    expect(actionControls.props.className).toContain('md:flex-row');
    expect(actionControls.props.className).not.toMatch(/(^|\s)flex-row/);
    expect(
      screen.getByRole('button', { name: 'Complete Cancel free trial' }).props
        .className,
    ).toContain('w-full');

    await act(async () => {
      fireEvent.press(screen.getByText('Open FoundersCard'));
      await Promise.resolve();
    });
    fireEvent.press(screen.getByText('Complete'));

    expect(openUrl).toHaveBeenCalledWith('https://founderscard.com/');
    expect(onComplete).toHaveBeenCalledWith('founderscard-trial');
    openUrl.mockRestore();
  });

  it('keeps a missing action link quiet while leaving Complete available', () => {
    render(
      <FinancialItemDetail
        item={items[1]}
        onComplete={jest.fn().mockResolvedValue(true)}
        referenceDate={referenceDate}
      />,
    );

    expect(screen.queryByText('Next action')).toBeNull();
    expect(screen.getByText('No action link saved')).toBeTruthy();
    expect(
      screen.getByText('Open the provider’s app or website manually.'),
    ).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
    expect(
      screen.getByRole('button', {
        name: "Complete Use monthly Dunkin' credit",
      }),
    ).toBeTruthy();
  });
});
