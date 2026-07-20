import type { ChangeEvent } from 'react';

import type { DeadlineFieldProps } from '@/features/financial-items/components/deadline-field.types';

const INPUT_ID = 'financial-item-deadline';
const ERROR_ID = `${INPUT_ID}-error`;

export function DeadlineField({
  disabled = false,
  error,
  onChange,
  value,
}: DeadlineFieldProps) {
  return (
    <div>
      <label className="text-sm font-extrabold text-ink" htmlFor={INPUT_ID}>
        Deadline <span className="font-semibold text-slate">(required)</span>
      </label>
      <input
        aria-describedby={error ? ERROR_ID : undefined}
        aria-invalid={Boolean(error)}
        className={`mt-2 min-h-12 w-full rounded-xl border bg-surface px-4 py-3 text-base text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
          error ? 'border-risk' : 'border-line'
        }`}
        disabled={disabled}
        id={INPUT_ID}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.currentTarget.value)
        }
        required
        type="date"
        value={value}
      />
      {error && (
        <div
          aria-live="polite"
          className="mt-1.5 text-sm font-semibold leading-5 text-risk"
          id={ERROR_ID}
        >
          {error}
        </div>
      )}
    </div>
  );
}
