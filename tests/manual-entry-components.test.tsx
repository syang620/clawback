import DateTimePicker from '@expo/ui/community/datetime-picker';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { AddMenu } from '@/features/financial-items/components/add-menu';
import { ManualFinancialItemForm } from '@/features/financial-items/components/manual-financial-item-form';
import { calendarDateToLocalNoon } from '@/lib/dates';

function selectDeadline(value: string) {
  const date = calendarDateToLocalNoon(value);
  if (!date) throw new Error(`Test deadline must be valid: ${value}`);

  fireEvent.press(screen.getByRole('button', { name: /Deadline, required/ }));
  const picker = screen.UNSAFE_getByType(DateTimePicker);
  act(() => {
    picker.props.onValueChange?.(
      {
        nativeEvent: {
          timestamp: date.getTime(),
          utcOffset: -date.getTimezoneOffset(),
        },
      },
      date,
    );
  });
  fireEvent.press(
    screen.getByRole('button', { name: 'Use selected deadline' }),
  );
}

describe('Milestone 03 Add menu', () => {
  it('offers exactly the three manual task types and supports cancellation', () => {
    const onCancel = jest.fn();
    const onSelect = jest.fn();
    render(
      <AddMenu
        mode="demo"
        onCancel={onCancel}
        onExtractEmail={jest.fn()}
        onSelect={onSelect}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Add a perk' }));
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSelect).toHaveBeenCalledWith('perk');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(
        'Email extraction requires Connected mode. You can still add a task manually.',
      ),
    ).toBeTruthy();
  });

  it('offers email extraction first in Connected mode and keeps manual choices', () => {
    const onExtractEmail = jest.fn();
    render(
      <AddMenu
        mode="connected"
        onCancel={jest.fn()}
        onExtractEmail={onExtractEmail}
        onSelect={jest.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0].props.accessibilityLabel).toBe('Extract from email');
    fireEvent.press(buttons[0]);
    expect(onExtractEmail).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Add a trial' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add a perk' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Add a subscription' }),
    ).toBeTruthy();
    const connectedGuidance = screen.getByLabelText('Connected demo guidance');
    expect(screen.getByText('Clean demo session')).toBeTruthy();
    expect(connectedGuidance.props.onPress).toBeUndefined();
    expect(connectedGuidance.props.accessibilityRole).toBeUndefined();
    expect(connectedGuidance.props.focusable).toBeUndefined();
    expect(connectedGuidance.props.tabIndex).toBeUndefined();
    expect(connectedGuidance.props.className).not.toMatch(
      /cursor|hover|active|focus/,
    );
    expect(
      screen.queryByRole('button', { name: 'Reset Local demo' }),
    ).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(
      screen.getByText(/fresh private or incognito browser session/),
    ).toBeTruthy();
    expect(
      screen.getByText(/original records remain unchanged but are unavailable/),
    ).toBeTruthy();
  });

  it('requires confirmation, preserves state on Cancel, and blocks duplicate reset confirmation', async () => {
    let resolveReset: (value: boolean) => void = () => undefined;
    const onResetLocalDemo = jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveReset = resolve;
        }),
    );
    render(
      <AddMenu
        mode="demo"
        onCancel={jest.fn()}
        onExtractEmail={jest.fn()}
        onResetLocalDemo={onResetLocalDemo}
        onSelect={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Reset Local demo' }));
    expect(screen.getByText('Replace this Local demo?')).toBeTruthy();
    expect(
      screen.getByText(/completed history, metrics, pending Undo/),
    ).toBeTruthy();

    fireEvent.press(
      screen.getByRole('button', { name: 'Cancel Local demo reset' }),
    );
    expect(onResetLocalDemo).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Add a perk' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Reset Local demo' }));
    const confirm = screen.getByRole('button', {
      name: 'Confirm Local demo reset',
    });
    fireEvent.press(confirm);
    fireEvent.press(confirm);
    expect(onResetLocalDemo).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveReset(true);
      await Promise.resolve();
    });
  });
});

describe('Milestone 03 manual-entry form', () => {
  it('emphasizes the type-specific amount while preserving both money fields', () => {
    render(
      <ManualFinancialItemForm
        initialKind="perk"
        onCancel={jest.fn()}
        onSave={jest.fn().mockResolvedValue(true)}
      />,
    );

    expect(
      screen.getByText('For perks, this amount updates Available.'),
    ).toBeTruthy();
    expect(screen.getByLabelText('Value available, optional')).toBeTruthy();
    expect(screen.getByLabelText('Charge at risk, optional')).toBeTruthy();

    fireEvent.press(screen.getByRole('radio', { name: 'Trial' }));
    expect(
      screen.getByText(
        'For trials and subscriptions, this amount updates At Risk.',
      ),
    ).toBeTruthy();
  });

  it('preserves entered values and blocks save when fields are invalid', () => {
    const onSave = jest.fn().mockResolvedValue(true);
    render(
      <ManualFinancialItemForm
        initialKind="trial"
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    fireEvent.changeText(
      screen.getByPlaceholderText('Review annual renewal'),
      'Keep me',
    );
    fireEvent.changeText(screen.getAllByPlaceholderText('0.00')[0], '12.345');
    fireEvent.changeText(
      screen.getByPlaceholderText('https://example.com/account'),
      'http://example.com',
    );
    fireEvent.press(screen.getByRole('button', { name: 'Save task' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('Keep me')).toBeTruthy();
    expect(screen.getByText('Select a date')).toBeTruthy();
    expect(screen.getByDisplayValue('12.345')).toBeTruthy();
    expect(screen.getByDisplayValue('http://example.com')).toBeTruthy();
    expect(screen.getByText('Enter a deadline.')).toBeTruthy();
    expect(
      screen.getByText(
        'Enter a non-negative dollar amount with no more than two decimal places.',
      ),
    ).toBeTruthy();
  });

  it('submits a normalized item exactly once and supports Cancel separately', async () => {
    const onCancel = jest.fn();
    let resolveSave: (value: boolean) => void = () => undefined;
    const onSave = jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveSave = resolve;
        }),
    );
    render(
      <ManualFinancialItemForm
        initialKind="perk"
        onCancel={onCancel}
        onSave={onSave}
      />,
    );

    fireEvent.changeText(
      screen.getByPlaceholderText('Review annual renewal'),
      'Use travel credit',
    );
    selectDeadline('2026-07-31');
    fireEvent.changeText(
      screen.getAllByPlaceholderText('0.00')[0],
      '$1,234.56',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('https://example.com/account'),
      'https://example.com/account',
    );
    fireEvent.press(screen.getByRole('radio', { name: 'Quarterly' }));

    const save = screen.getByRole('button', { name: 'Save task' });
    fireEvent.press(save);
    fireEvent.press(save);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      kind: 'perk',
      title: 'Use travel credit',
      provider: null,
      valueCents: 123_456,
      chargeAmountCents: null,
      dueAt: '2026-07-31T12:00:00.000Z',
      recurrence: 'quarterly',
      actionUrl: 'https://example.com/account',
      source: 'manual',
      extractionConfidence: null,
    });
    expect(screen.getByText('Saving…')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /Deadline, required/ }).props
        .accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(
      screen.getByRole('button', { name: 'Cancel' }).props.accessibilityState,
    ).toMatchObject({ disabled: true });

    resolveSave(true);
    await screen.findByText('Save task');
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('preserves values and shows a recoverable inline error after save failure', async () => {
    const onSave = jest.fn().mockResolvedValue(false);
    const view = render(
      <ManualFinancialItemForm
        initialKind="trial"
        onCancel={jest.fn()}
        onSave={onSave}
        saveError={{ message: 'We could not save this task. Try again.' }}
      />,
    );

    fireEvent.changeText(
      screen.getByPlaceholderText('Review annual renewal'),
      'Keep this title',
    );
    selectDeadline('2026-08-01');
    fireEvent.press(screen.getByRole('button', { name: 'Save task' }));
    await screen.findByText('Save task');

    expect(screen.getByDisplayValue('Keep this title')).toBeTruthy();
    expect(screen.getByText('Aug 1, 2026')).toBeTruthy();
    expect(
      screen.getByText('We could not save this task. Try again.'),
    ).toBeTruthy();
    view.unmount();
  });
});
