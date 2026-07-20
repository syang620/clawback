import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { DemoControls } from '@/features/financial-items/components/demo-controls';

const mockFocusAccessibilityTarget = jest.fn((_target: unknown) => true);

jest.mock('@/components/accessibility-focus', () => ({
  focusAccessibilityTarget: (target: unknown) =>
    mockFocusAccessibilityTarget(target),
}));

describe('Checkpoint 6C reset confirmation focus', () => {
  beforeEach(() => mockFocusAccessibilityTarget.mockClear());

  it('focuses confirmation and restores Reset focus after Cancel', () => {
    render(
      <DemoControls
        mode="demo"
        onResetLocalDemo={jest.fn().mockResolvedValue(true)}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Reset Local demo' }));
    expect(mockFocusAccessibilityTarget).toHaveBeenCalledTimes(1);
    fireEvent.press(
      screen.getByRole('button', { name: 'Cancel Local demo reset' }),
    );
    expect(mockFocusAccessibilityTarget).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole('button', { name: 'Reset Local demo' }),
    ).toBeTruthy();
  });

  it('maps an unexpected reset rejection to safe inline recovery', async () => {
    const view = render(
      <DemoControls
        mode="demo"
        onResetLocalDemo={jest
          .fn()
          .mockRejectedValue(new Error('private repository payload'))}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Reset Local demo' }));
    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', { name: 'Confirm Local demo reset' }),
      );
      await Promise.resolve();
    });

    expect(screen.getByText(/Nothing was replaced/)).toBeTruthy();
    expect(JSON.stringify(view.toJSON())).not.toContain(
      'private repository payload',
    );
  });
});
