import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo, Platform, Text } from 'react-native';

type FocusRequest = () => void;

interface AccessibilityFocusContextValue {
  announce: (message: string) => void;
  focusCurrentPageHeading: () => boolean;
  registerPageHeading: (focus: FocusRequest) => () => void;
}

const AccessibilityFocusContext =
  createContext<AccessibilityFocusContextValue | null>(null);

export function focusAccessibilityTarget(target: unknown): boolean {
  if (!target || (typeof target !== 'object' && typeof target !== 'function')) {
    return false;
  }

  const focusable = target as { focus?: () => void };
  if (typeof focusable.focus === 'function') {
    focusable.focus();
    return true;
  }

  if (Platform.OS !== 'web') {
    AccessibilityInfo.sendAccessibilityEvent(target as never, 'focus');
    return true;
  }

  return false;
}

export function AccessibilityFocusProvider({ children }: PropsWithChildren) {
  const currentPageHeadingRef = useRef<FocusRequest | null>(null);
  const announcementSequenceRef = useRef(0);
  const [webAnnouncement, setWebAnnouncement] = useState({
    id: 0,
    message: '',
  });

  const registerPageHeading = useCallback((focus: FocusRequest) => {
    currentPageHeadingRef.current = focus;
    return () => {
      if (currentPageHeadingRef.current === focus) {
        currentPageHeadingRef.current = null;
      }
    };
  }, []);

  const focusCurrentPageHeading = useCallback(() => {
    const focus = currentPageHeadingRef.current;
    if (!focus) return false;
    focus();
    return true;
  }, []);

  const announce = useCallback((message: string) => {
    if (Platform.OS === 'web') {
      announcementSequenceRef.current += 1;
      setWebAnnouncement({
        id: announcementSequenceRef.current,
        message,
      });
      return;
    }

    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const value = useMemo<AccessibilityFocusContextValue>(
    () => ({ announce, focusCurrentPageHeading, registerPageHeading }),
    [announce, focusCurrentPageHeading, registerPageHeading],
  );

  return (
    <AccessibilityFocusContext.Provider value={value}>
      {children}
      {Platform.OS === 'web' && (
        <Text
          accessibilityLiveRegion="polite"
          key={webAnnouncement.id}
          role="status"
          style={{
            height: 1,
            left: -10_000,
            overflow: 'hidden',
            position: 'absolute',
            top: 0,
            width: 1,
          }}
        >
          {webAnnouncement.message}
        </Text>
      )}
    </AccessibilityFocusContext.Provider>
  );
}

export function useAccessibilityFocus(): AccessibilityFocusContextValue {
  return (
    useContext(AccessibilityFocusContext) ?? {
      announce: () => undefined,
      focusCurrentPageHeading: () => false,
      registerPageHeading: () => () => undefined,
    }
  );
}
