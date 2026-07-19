import { render, screen } from '@testing-library/react-native';

import { AppHeader } from '@/components/app-header';

let mockMode: 'demo' | 'connected' = 'demo';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  usePathname: () => '/',
}));

jest.mock('@/features/financial-items/hooks/use-financial-items', () => ({
  useFinancialItems: () => ({ mode: mockMode }),
}));

describe('Checkpoint 4B mode indicator', () => {
  it('shows truthful noninteractive demo and connected labels', () => {
    const view = render(<AppHeader />);
    expect(screen.getByText('Local demo')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Local demo' })).toBeNull();

    mockMode = 'connected';
    view.rerender(<AppHeader />);
    expect(screen.getByText('Connected')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Connected' })).toBeNull();
  });
});
