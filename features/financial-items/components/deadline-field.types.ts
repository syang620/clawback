export interface DeadlineFieldHandle {
  focus: () => void;
}

export interface DeadlineFieldProps {
  disabled?: boolean;
  error?: string;
  fallbackDate?: Date;
  onChange: (value: string) => void;
  value: string;
}
