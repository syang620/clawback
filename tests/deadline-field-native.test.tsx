import type { DateTimePickerProps } from '@expo/ui/community/datetime-picker';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { DeadlineField } from '@/features/financial-items/components/deadline-field.native';
import { calendarDateToLocalNoon, localDateToCalendarDate } from '@/lib/dates';

let mockPickerProps: DateTimePickerProps | null = null;

jest.mock('@expo/ui/community/datetime-picker', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');

  return {
    __esModule: true,
    default: (props: DateTimePickerProps) => {
      mockPickerProps = props;
      return React.createElement(View, {
        accessibilityLabel: 'Native deadline picker',
      });
    },
  };
});

function pickerProps(): DateTimePickerProps {
  if (!mockPickerProps)
    throw new Error('Expected the native picker to render.');
  return mockPickerProps;
}

function pickerEvent(date: Date) {
  return {
    nativeEvent: {
      timestamp: date.getTime(),
      utcOffset: -date.getTimezoneOffset(),
    },
  };
}

describe('Native DeadlineField', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    mockPickerProps = null;
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatform,
    });
  });

  it('initializes from an existing value and Cancel preserves it', () => {
    const onChange = jest.fn();
    render(
      <DeadlineField
        fallbackDate={new Date(2026, 6, 19, 8)}
        onChange={onChange}
        value="2026-08-15"
      />,
    );

    expect(screen.getByText('Aug 15, 2026')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /Deadline, required/ }));
    expect(localDateToCalendarDate(pickerProps().value)).toBe('2026-08-15');

    const staged = calendarDateToLocalNoon('2026-09-30') as Date;
    act(() => pickerProps().onValueChange?.(pickerEvent(staged), staged));
    fireEvent.press(
      screen.getByRole('button', { name: 'Cancel deadline selection' }),
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Aug 15, 2026')).toBeTruthy();
  });

  it('uses the fallback for empty or invalid values without an implicit commit', () => {
    const onChange = jest.fn();
    const view = render(
      <DeadlineField
        fallbackDate={new Date(2026, 6, 19, 22)}
        onChange={onChange}
        value=""
      />,
    );

    expect(screen.getByText('Select a date')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /Deadline, required/ }));
    expect(localDateToCalendarDate(pickerProps().value)).toBe('2026-07-19');
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.press(
      screen.getByRole('button', { name: 'Cancel deadline selection' }),
    );

    view.rerender(
      <DeadlineField
        fallbackDate={new Date(2026, 6, 19, 22)}
        onChange={onChange}
        value="2026-02-30"
      />,
    );
    expect(screen.getByText('2026-02-30')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /Deadline, required/ }));
    expect(localDateToCalendarDate(pickerProps().value)).toBe('2026-07-19');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('stages a leap day at local noon and commits exactly once', () => {
    const onChange = jest.fn();
    render(<DeadlineField onChange={onChange} value="2028-02-28" />);
    fireEvent.press(screen.getByRole('button', { name: /Deadline, required/ }));

    const leapDay = new Date(2028, 1, 29, 0, 15);
    act(() => pickerProps().onValueChange?.(pickerEvent(leapDay), leapDay));
    expect(onChange).not.toHaveBeenCalled();
    expect(pickerProps().value.getHours()).toBe(12);
    fireEvent.press(
      screen.getByRole('button', { name: 'Use selected deadline' }),
    );

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2028-02-29');
  });

  it('closes without committing if the surrounding form becomes disabled', () => {
    const onChange = jest.fn();
    const view = render(
      <DeadlineField onChange={onChange} value="2026-08-15" />,
    );
    fireEvent.press(screen.getByRole('button', { name: /Deadline, required/ }));

    view.rerender(
      <DeadlineField disabled onChange={onChange} value="2026-08-15" />,
    );

    expect(screen.queryByText('Select deadline')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    const field = screen.getByRole('button', { name: /Deadline, required/ });
    expect(field.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(field);
    expect(screen.queryByText('Select deadline')).toBeNull();
  });

  it('uses the Android dialog and treats dismissal as Cancel', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
    const onChange = jest.fn();
    render(<DeadlineField onChange={onChange} value="2026-12-31" />);
    fireEvent.press(screen.getByRole('button', { name: /Deadline, required/ }));

    expect(pickerProps().presentation).toBe('dialog');
    act(() => pickerProps().onDismiss?.());
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: /Deadline, required/ }));
    const newYear = calendarDateToLocalNoon('2027-01-01') as Date;
    act(() => pickerProps().onValueChange?.(pickerEvent(newYear), newYear));
    expect(onChange).toHaveBeenCalledWith('2027-01-01');
  });

  it('retains required-field error copy', () => {
    render(
      <DeadlineField error="Enter a deadline." onChange={jest.fn()} value="" />,
    );

    expect(screen.getByText('Enter a deadline.')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /Error: Enter a deadline/ }),
    ).toBeTruthy();
  });
});
