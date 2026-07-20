import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { DeadlineField } from '@/features/financial-items/components/deadline-field.web';

describe('Web DeadlineField', () => {
  it('uses native date-input semantics and emits YYYY-MM-DD', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer | null = null;

    act(() => {
      renderer = create(
        <DeadlineField onChange={onChange} value="2028-02-29" />,
      );
    });

    const input = renderer!.root.findByType('input');
    const label = renderer!.root.findByType('label');
    expect(input.props).toMatchObject({
      id: 'financial-item-deadline',
      required: true,
      type: 'date',
      value: '2028-02-29',
    });
    expect(label.props.htmlFor).toBe(input.props.id);
    expect(input.props.className).toContain('focus-visible:outline');

    act(() => {
      input.props.onChange({ currentTarget: { value: '2029-01-01' } });
    });
    expect(onChange).toHaveBeenCalledWith('2029-01-01');
  });

  it('preserves disabled and required-error semantics', () => {
    let renderer: ReactTestRenderer | null = null;
    act(() => {
      renderer = create(
        <DeadlineField
          disabled
          error="Enter a deadline."
          onChange={jest.fn()}
          value=""
        />,
      );
    });

    const input = renderer!.root.findByType('input');
    const error = renderer!.root.findByProps({
      id: 'financial-item-deadline-error',
    });
    expect(input.props.disabled).toBe(true);
    expect(input.props['aria-invalid']).toBe(true);
    expect(input.props['aria-describedby']).toBe(error.props.id);
    expect(error.children).toContain('Enter a deadline.');
  });
});
