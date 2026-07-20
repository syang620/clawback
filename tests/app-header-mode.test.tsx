import { render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

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

  it('marks the active web link with aria-current without tab selection state', () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });
    try {
      render(<AppHeader />);

      const navigation = screen.getByLabelText('Primary navigation');
      const home = screen.getByRole('link', { name: 'Home' });
      const activity = screen.getByRole('link', { name: 'Activity' });
      expect(navigation.props.role).toBe('navigation');
      expect(home.props['aria-current']).toBe('page');
      expect(home.props.accessibilityState.selected).toBeUndefined();
      expect(home.props['aria-selected']).toBeUndefined();
      expect(activity.props['aria-current']).toBeUndefined();
    } finally {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatform,
      });
    }
  });
});
