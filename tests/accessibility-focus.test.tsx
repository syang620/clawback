import { fireEvent, render, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { AccessibilityInfo, Pressable, Text } from 'react-native';

import {
  AccessibilityFocusProvider,
  useAccessibilityFocus,
} from '@/components/accessibility-focus';
import { PageHeading, SectionHeading } from '@/components/page-heading';

function FocusHarness({ focus }: { focus: () => void }) {
  const { announce, focusCurrentPageHeading, registerPageHeading } =
    useAccessibilityFocus();

  useEffect(() => registerPageHeading(focus), [focus, registerPageHeading]);

  return (
    <>
      <Pressable
        accessibilityLabel="Focus current page heading"
        accessibilityRole="button"
        onPress={focusCurrentPageHeading}
      >
        <Text>Focus</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="Announce restoration"
        accessibilityRole="button"
        onPress={() => announce('Restored Example to active tasks.')}
      >
        <Text>Announce</Text>
      </Pressable>
    </>
  );
}

describe('Checkpoint 6C accessibility focus infrastructure', () => {
  it('registers the current page target and announces native status once', () => {
    const focus = jest.fn();
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation();
    render(
      <AccessibilityFocusProvider>
        <FocusHarness focus={focus} />
      </AccessibilityFocusProvider>,
    );

    fireEvent.press(
      screen.getByRole('button', { name: 'Focus current page heading' }),
    );
    expect(focus).toHaveBeenCalledTimes(1);

    fireEvent.press(
      screen.getByRole('button', { name: 'Announce restoration' }),
    );
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('Restored Example to active tasks.');
    announce.mockRestore();
  });

  it('exposes one page heading and subordinate section headings', () => {
    render(
      <AccessibilityFocusProvider>
        <PageHeading active={false}>Create a task</PageHeading>
        <SectionHeading>Details</SectionHeading>
      </AccessibilityFocusProvider>,
    );

    expect(screen.getByRole('header', { name: 'Create a task' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Details' })).toBeTruthy();
  });
});
