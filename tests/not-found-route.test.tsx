import { render, screen } from '@testing-library/react-native';

import NotFoundRoute from '@/app/+not-found';

const mockLink = jest.fn(
  ({ children }: { children: React.ReactNode }) => children,
);

jest.mock('expo-router', () => ({
  Link: (props: { children: React.ReactNode }) => mockLink(props),
  Stack: { Screen: () => null },
  useIsFocused: () => true,
}));

jest.mock('@/components/app-header', () => ({ AppHeader: () => null }));

describe('Checkpoint 6C not-found recovery', () => {
  it('provides a page heading and semantic Home destination', () => {
    render(<NotFoundRoute />);

    expect(screen.getByRole('header', { name: 'Page not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Return Home' })).toBeTruthy();
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({ href: '/' }),
    );
  });
});
