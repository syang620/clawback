import { fireEvent, render, screen } from '@testing-library/react-native';

import { AddMenu } from '@/features/financial-items/components/add-menu';
import { ManualFinancialItemForm } from '@/features/financial-items/components/manual-financial-item-form';

describe('Milestone 03 Add menu', () => {
  it('offers exactly the three manual task types and supports cancellation', () => {
    const onCancel = jest.fn();
    const onSelect = jest.fn();
    render(<AddMenu onCancel={onCancel} onSelect={onSelect} />);

    fireEvent.press(screen.getByRole('button', { name: 'Add a perk' }));
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSelect).toHaveBeenCalledWith('perk');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/parse email/i)).toBeNull();
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
    fireEvent.changeText(
      screen.getByPlaceholderText('YYYY-MM-DD'),
      '2026-02-30',
    );
    fireEvent.changeText(screen.getAllByPlaceholderText('0.00')[0], '12.345');
    fireEvent.changeText(
      screen.getByPlaceholderText('https://example.com/account'),
      'http://example.com',
    );
    fireEvent.press(screen.getByRole('button', { name: 'Save task' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('Keep me')).toBeTruthy();
    expect(screen.getByDisplayValue('2026-02-30')).toBeTruthy();
    expect(screen.getByDisplayValue('12.345')).toBeTruthy();
    expect(screen.getByDisplayValue('http://example.com')).toBeTruthy();
    expect(
      screen.getByText('Enter a real calendar date in YYYY-MM-DD format.'),
    ).toBeTruthy();
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
    fireEvent.changeText(
      screen.getByPlaceholderText('YYYY-MM-DD'),
      '2026-07-31',
    );
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
    fireEvent.changeText(
      screen.getByPlaceholderText('YYYY-MM-DD'),
      '2026-08-01',
    );
    fireEvent.press(screen.getByRole('button', { name: 'Save task' }));
    await screen.findByText('Save task');

    expect(screen.getByDisplayValue('Keep this title')).toBeTruthy();
    expect(screen.getByDisplayValue('2026-08-01')).toBeTruthy();
    expect(
      screen.getByText('We could not save this task. Try again.'),
    ).toBeTruthy();
    view.unmount();
  });
});
