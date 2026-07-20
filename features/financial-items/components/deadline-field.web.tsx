import {
  type ChangeEvent,
  forwardRef,
  useId,
  useImperativeHandle,
  useRef,
} from 'react';

import type {
  DeadlineFieldHandle,
  DeadlineFieldProps,
} from '@/features/financial-items/components/deadline-field.types';

export const DeadlineField = forwardRef<
  DeadlineFieldHandle,
  DeadlineFieldProps
>(function DeadlineField({ disabled = false, error, onChange, value }, ref) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  return (
    <div>
      <label className="text-sm font-extrabold text-ink" htmlFor={inputId}>
        Deadline <span className="font-semibold text-slate">(required)</span>
      </label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        className={`mt-2 min-h-12 w-full rounded-xl border bg-surface px-4 py-3 text-base text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
          error ? 'border-risk' : 'border-line'
        }`}
        disabled={disabled}
        id={inputId}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.currentTarget.value)
        }
        required
        ref={inputRef}
        type="date"
        value={value}
      />
      {error && (
        <div
          aria-live="polite"
          className="mt-1.5 text-sm font-semibold leading-5 text-risk"
          id={errorId}
        >
          {error}
        </div>
      )}
    </div>
  );
});
