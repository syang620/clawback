import {
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { Platform, StyleSheet, Text } from 'react-native';

import {
  focusAccessibilityTarget,
  useAccessibilityFocus,
} from '@/components/accessibility-focus';

interface HeadingProps extends PropsWithChildren {
  accessibilityLabel?: string;
  className?: string;
}

interface SectionHeadingProps extends HeadingProps {
  level?: 2 | 3;
}

interface PageHeadingProps extends HeadingProps {
  active?: boolean;
  visuallyHidden?: boolean;
}

function webHeadingProps(level: 1 | 2 | 3, focusable = false) {
  if (Platform.OS !== 'web') return {};
  return {
    'aria-level': level,
    role: 'heading' as const,
    ...(focusable ? { tabIndex: -1 as const } : {}),
  };
}

export function PageHeading({
  accessibilityLabel,
  active = true,
  children,
  className = '',
  visuallyHidden = false,
}: PageHeadingProps) {
  const headingRef = useRef<unknown>(null);
  const { registerPageHeading } = useAccessibilityFocus();
  const focus = useCallback(() => {
    focusAccessibilityTarget(headingRef.current);
  }, []);

  useEffect(() => {
    if (!active) return;
    const unregister = registerPageHeading(focus);
    focus();
    return unregister;
  }, [active, focus, registerPageHeading]);

  return (
    <Text
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="header"
      className={`${className} web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand`}
      ref={headingRef as never}
      style={visuallyHidden ? styles.visuallyHidden : undefined}
      {...webHeadingProps(1, true)}
    >
      {children}
    </Text>
  );
}

export function SectionHeading({
  accessibilityLabel,
  children,
  className = '',
  level = 2,
}: SectionHeadingProps) {
  return (
    <Text
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="header"
      className={className}
      {...webHeadingProps(level)}
    >
      {children as ReactNode}
    </Text>
  );
}

const styles = StyleSheet.create({
  visuallyHidden: {
    height: 1,
    left: 0,
    opacity: 0,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    width: 1,
  },
});
