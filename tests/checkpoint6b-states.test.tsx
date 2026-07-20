import { fireEvent, render, screen } from '@testing-library/react-native';

import { InitializationScreen } from '@/components/initialization-screen';
import { createDemoItems } from '@/constants/demo-data';
import { Dashboard } from '@/features/financial-items/components/dashboard';
import { completeFinancialItem } from '@/features/financial-items/logic/status-transitions';

const mockLink = jest.fn(
  ({ children }: { children: React.ReactNode }) => children,
);

jest.mock('expo-router', () => ({
  Link: (props: { children: React.ReactNode }) => mockLink(props),
  usePathname: () => '/',
}));

jest.mock('@/features/financial-items/components/swipe-to-strike', () => ({
  SwipeToStrike: ({ children }: { children: () => React.ReactNode }) =>
    children(),
}));

jest.mock('@/features/financial-items/hooks/use-financial-items', () => ({
  useFinancialItems: () => ({ mode: 'demo' }),
}));

describe('Checkpoint 6B state presentation', () => {
  it('keeps Clawback identity visible with specific startup copy', () => {
    render(
      <InitializationScreen
        initialization={{ phase: 'authenticating' }}
        onRetry={jest.fn()}
      />,
    );

    expect(screen.getByText('CLAWBACK')).toBeTruthy();
    expect(
      screen.getByText('Starting your private Connected session…'),
    ).toBeTruthy();
    expect(
      screen.queryByText('Catch deadlines before money slips away'),
    ).toBeNull();
  });

  it('bounds configuration errors, omits raw payloads, and offers Retry only when useful', () => {
    const rawMessage =
      'https://secret.example?jwt=private stack trace API_KEY=do-not-render';
    const retry = jest.fn();
    const view = render(
      <InitializationScreen
        initialization={{
          phase: 'configuration-error',
          message: rawMessage,
        }}
        onRetry={retry}
      />,
    );

    expect(screen.getByText('Connected mode needs setup')).toBeTruthy();
    expect(screen.queryByText(rawMessage)).toBeNull();
    expect(JSON.stringify(view.toJSON())).not.toContain('do-not-render');
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();

    view.rerender(
      <InitializationScreen
        initialization={{ phase: 'read-error', message: rawMessage }}
        onRetry={retry}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(view.toJSON())).not.toContain('do-not-render');
  });

  it('offers Activity only when an empty Home has history', () => {
    const referenceDate = new Date('2026-07-16T00:00:00.000Z');
    const completed = completeFinancialItem(
      createDemoItems(referenceDate)[0],
      new Date('2026-07-17T00:00:00.000Z'),
    );
    render(
      <Dashboard
        items={[completed]}
        onComplete={jest.fn().mockResolvedValue(true)}
        referenceDate={referenceDate}
      />,
    );

    expect(
      screen.getByRole('link', { name: 'Add a financial task' }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View Activity' })).toBeTruthy();
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({ href: '/activity' }),
    );
  });
});
