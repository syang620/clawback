import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Platform, Pressable, Text } from 'react-native';

import { SwipeToStrike } from '@/features/financial-items/components/swipe-to-strike';

const mockSwipeableReset = jest.fn();
let mockSwipeableProps: Record<string, unknown> | null = null;
let mockReduceMotion = false;

jest.mock('@/hooks/use-reduced-motion-preference', () => ({
  useReducedMotionPreference: () => mockReduceMotion,
}));

jest.mock('react-native-reanimated', () => {
  const ReactNative = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: { View: ReactNative.View },
    Extrapolation: { CLAMP: 'clamp' },
    interpolate: (value: number) => value,
    useAnimatedStyle: (factory: () => object) => factory(),
  };
});

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const MockSwipeable = React.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      mockSwipeableProps = props;
      React.useImperativeHandle(ref, () => ({ reset: mockSwipeableReset }));
      return React.createElement(
        View,
        { testID: 'mock-swipeable' },
        props.children,
      );
    },
  );

  return { __esModule: true, default: MockSwipeable };
});

function renderSwipe(
  onComplete: (id: string) => boolean,
  isRouteFocused = true,
) {
  return render(
    <SwipeToStrike
      isRouteFocused={isRouteFocused}
      itemId="task-1"
      onComplete={onComplete}
    >
      {(completeItem) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => completeItem('task-1')}
        >
          <Text>Complete task</Text>
        </Pressable>
      )}
    </SwipeToStrike>,
  );
}

function measureCard(width: number) {
  fireEvent(screen.getByTestId('swipe-measure-task-1'), 'layout', {
    nativeEvent: { layout: { height: 200, width, x: 0, y: 0 } },
  });
}

describe('Checkpoint 2B swipe wrapper', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    mockReduceMotion = false;
    mockSwipeableProps = null;
    mockSwipeableReset.mockClear();
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatform,
    });
  });

  it('keeps the button functional without mounting swipe before measurement', () => {
    const onComplete = jest.fn(() => true);
    renderSwipe(onComplete);

    expect(screen.queryByTestId('mock-swipeable')).toBeNull();
    fireEvent.press(screen.getByText('Complete task'));

    expect(onComplete).toHaveBeenCalledWith('task-1');
  });

  it('uses 60% of positive measured width and guards repeat callbacks', () => {
    const onComplete = jest.fn(() => true);
    renderSwipe(onComplete);
    measureCard(300);

    expect(screen.getByTestId('mock-swipeable')).toBeTruthy();
    expect(mockSwipeableProps?.leftThreshold).toBe(180);
    expect(mockSwipeableProps?.overshootLeft).toBe(false);

    act(() => {
      (mockSwipeableProps?.onSwipeableOpen as () => boolean)();
      (mockSwipeableProps?.onSwipeableOpen as () => boolean)();
    });

    expect(mockSwipeableReset).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('resets local swipe state before button completion', () => {
    const onComplete = jest.fn(() => true);
    renderSwipe(onComplete);
    measureCard(320);

    fireEvent.press(screen.getByText('Complete task'));

    expect(mockSwipeableReset).toHaveBeenCalledTimes(1);
    expect(mockSwipeableReset.mock.invocationCallOrder[0]).toBeLessThan(
      onComplete.mock.invocationCallOrder[0],
    );
  });

  it('resets only local gesture state on route blur and unmount', () => {
    const onComplete = jest.fn(() => true);
    const view = renderSwipe(onComplete);
    measureCard(320);

    view.rerender(
      <SwipeToStrike
        isRouteFocused={false}
        itemId="task-1"
        onComplete={onComplete}
      >
        {(completeItem) => (
          <Pressable onPress={() => completeItem('task-1')}>
            <Text>Complete task</Text>
          </Pressable>
        )}
      </SwipeToStrike>,
    );
    expect(mockSwipeableReset).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();

    view.unmount();
    expect(mockSwipeableReset).toHaveBeenCalledTimes(2);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('omits swipe on web and when reduced motion is enabled', () => {
    const webCompletion = jest.fn(() => true);
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });
    const webView = renderSwipe(webCompletion);
    measureCard(320);
    expect(screen.queryByTestId('mock-swipeable')).toBeNull();
    fireEvent.press(screen.getByText('Complete task'));
    expect(webCompletion).toHaveBeenCalledTimes(1);
    webView.unmount();

    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    mockReduceMotion = true;
    const reducedCompletion = jest.fn(() => true);
    renderSwipe(reducedCompletion);
    measureCard(320);
    expect(screen.queryByTestId('mock-swipeable')).toBeNull();
    fireEvent.press(screen.getByText('Complete task'));
    expect(reducedCompletion).toHaveBeenCalledTimes(1);
  });
});
