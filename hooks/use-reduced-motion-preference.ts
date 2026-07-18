import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotionPreference(): boolean {
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let isActive = true;
    let receivedChangeEvent = false;

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled) => {
        receivedChangeEvent = true;
        if (isActive) setReduceMotion(isEnabled);
      },
    );

    void AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      if (isActive && !receivedChangeEvent) setReduceMotion(isEnabled);
    });

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
