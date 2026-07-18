import { act, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Text } from 'react-native';

import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';

function ReducedMotionHarness() {
  const reduceMotion = useReducedMotionPreference();
  return <Text>{reduceMotion ? 'Motion reduced' : 'Motion enabled'}</Text>;
}

describe('Checkpoint 2B reduced-motion preference', () => {
  afterEach(() => jest.restoreAllMocks());

  it('defaults to reduced motion until resolved and cleans up its listener', async () => {
    let resolvePreference: ((value: boolean) => void) | undefined;
    let changeListener: ((value: boolean) => void) | undefined;
    const remove = jest.fn();
    const preference = new Promise<boolean>((resolve) => {
      resolvePreference = resolve;
    });

    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockReturnValue(preference);
    const accessibilityEvents = AccessibilityInfo as unknown as {
      addEventListener: (
        eventName: string,
        listener: (value: boolean) => void,
      ) => { remove: () => void };
    };
    jest
      .spyOn(accessibilityEvents, 'addEventListener')
      .mockImplementation((_, listener) => {
        changeListener = listener;
        return { remove };
      });

    const view = render(<ReducedMotionHarness />);
    expect(screen.getByText('Motion reduced')).toBeTruthy();

    await act(async () => resolvePreference?.(false));
    await waitFor(() =>
      expect(screen.getByText('Motion enabled')).toBeTruthy(),
    );

    act(() => changeListener?.(true));
    expect(screen.getByText('Motion reduced')).toBeTruthy();

    view.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
