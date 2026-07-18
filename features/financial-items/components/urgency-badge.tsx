import { Text } from 'react-native';

import type { DeadlinePresentation } from '@/features/financial-items/logic/urgency';

interface UrgencyBadgeProps {
  presentation: DeadlinePresentation;
}

const urgencyClasses = {
  'deadline-passed': 'bg-red-50 text-risk',
  critical: 'bg-red-50 text-risk',
  soon: 'bg-amber-100 text-attention',
  upcoming: 'bg-blue-50 text-brand',
  later: 'bg-canvas text-slate',
} as const;

export function UrgencyBadge({ presentation }: UrgencyBadgeProps) {
  const classes = presentation.urgencyBand
    ? urgencyClasses[presentation.urgencyBand]
    : 'bg-canvas text-slate';

  return (
    <Text
      accessibilityLabel={`Urgency: ${presentation.urgencyLabel}`}
      className={`rounded-full px-3 py-1 text-xs font-extrabold ${classes}`}
    >
      {presentation.urgencyLabel}
    </Text>
  );
}
