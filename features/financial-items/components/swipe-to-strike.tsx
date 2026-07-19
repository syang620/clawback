import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  type LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { useReducedMotionPreference } from '@/hooks/use-reduced-motion-preference';

export type ItemCompletionHandler = (id: string) => Promise<boolean>;

interface SwipeToStrikeProps {
  children: (onComplete: ItemCompletionHandler) => ReactNode;
  disabled?: boolean;
  isRouteFocused?: boolean;
  itemId: string;
  onComplete: ItemCompletionHandler;
}

interface StrikeActionProps {
  progress: SharedValue<number>;
  width: number;
}

function StrikeAction({ progress, width }: StrikeActionProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.6, 1],
      [0, 0.65, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          progress.value,
          [0, 1],
          [0.9, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.strikeAction, { width }, animatedStyle]}
    >
      <Text style={styles.strikeSymbol}>✓</Text>
      <Text style={styles.strikeLabel}>Ready to strike</Text>
    </Animated.View>
  );
}

export function SwipeToStrike({
  children,
  disabled = false,
  isRouteFocused = true,
  itemId,
  onComplete,
}: SwipeToStrikeProps) {
  const [cardWidth, setCardWidth] = useState(0);
  const reduceMotion = useReducedMotionPreference();
  const swipeableRef = useRef<SwipeableMethods>(null);
  const completionRequestedRef = useRef(false);
  const canSwipe =
    Platform.OS !== 'web' && !reduceMotion && !disabled && cardWidth > 0;

  const resetLocalGestureState = useCallback(() => {
    swipeableRef.current?.reset();
    completionRequestedRef.current = false;
  }, []);

  const requestCompletion = useCallback(async () => {
    if (disabled) return false;
    if (completionRequestedRef.current) return false;

    completionRequestedRef.current = true;
    swipeableRef.current?.reset();
    try {
      return await onComplete(itemId);
    } catch {
      return false;
    } finally {
      swipeableRef.current?.reset();
      completionRequestedRef.current = false;
    }
  }, [disabled, itemId, onComplete]);

  const completeFromCard = useCallback<ItemCompletionHandler>(
    async (requestedId) =>
      requestedId === itemId ? requestCompletion() : false,
    [itemId, requestCompletion],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const measuredWidth = event.nativeEvent.layout.width;
    if (measuredWidth > 0) setCardWidth(measuredWidth);
  }, []);

  useLayoutEffect(
    () => () => resetLocalGestureState(),
    [resetLocalGestureState],
  );

  useEffect(() => {
    if (!canSwipe) resetLocalGestureState();
  }, [canSwipe, resetLocalGestureState]);

  useEffect(() => {
    if (!isRouteFocused) resetLocalGestureState();
  }, [isRouteFocused, resetLocalGestureState]);

  return (
    <View onLayout={handleLayout} testID={`swipe-measure-${itemId}`}>
      {canSwipe ? (
        <Swipeable
          ref={swipeableRef}
          containerStyle={styles.swipeableContainer}
          dragOffsetFromLeftEdge={12}
          leftThreshold={cardWidth * 0.6}
          onSwipeableOpen={() => {
            void requestCompletion();
          }}
          overshootLeft={false}
          renderLeftActions={(progress) => (
            <StrikeAction progress={progress} width={cardWidth} />
          )}
        >
          {children(completeFromCard)}
        </Swipeable>
      ) : (
        children(completeFromCard)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  strikeAction: {
    alignItems: 'flex-start',
    backgroundColor: '#0F766E',
    borderRadius: 24,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  strikeSymbol: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  strikeLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  swipeableContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
});
