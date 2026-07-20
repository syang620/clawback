import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { ExternalAction } from '@/features/financial-items/components/external-action';

const mockFocusAccessibilityTarget = jest.fn((_target: unknown) => true);

jest.mock('@/components/accessibility-focus', () => ({
  focusAccessibilityTarget: (target: unknown) =>
    mockFocusAccessibilityTarget(target),
}));

describe('Checkpoint 6C external-action focus recovery', () => {
  it('returns focus to the preserved validated opener after Dismiss', async () => {
    const openUrl = jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValue(new Error('private platform payload'));
    render(<ExternalAction actionUrl="https://example.com/account?secret=1" />);

    await act(async () => {
      fireEvent.press(
        screen.getByRole('link', {
          name: 'Open action page on example.com',
        }),
      );
      await Promise.resolve();
    });
    fireEvent.press(
      screen.getByRole('button', { name: 'Dismiss action page error' }),
    );

    expect(mockFocusAccessibilityTarget).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('link', { name: 'Open action page on example.com' }),
    ).toBeTruthy();
    openUrl.mockRestore();
  });
});
