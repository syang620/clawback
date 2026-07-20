import { Text, View } from 'react-native';

import { formatMoney } from '@/lib/money';

interface MetricCardProps {
  className?: string;
  label: string;
  valueCents: number;
  description: string;
  tone: 'available' | 'risk' | 'protected';
}

const toneClasses = {
  available: 'border-brand/20 bg-blue-50',
  risk: 'border-risk/20 bg-red-50',
  protected: 'border-positive/20 bg-teal-50',
} as const;

const valueClasses = {
  available: 'text-brand',
  risk: 'text-risk',
  protected: 'text-positive',
} as const;

export function MetricCard({
  className = '',
  label,
  valueCents,
  description,
  tone,
}: MetricCardProps) {
  return (
    <View
      className={`min-w-0 flex-1 rounded-3xl border p-5 ${toneClasses[tone]} ${className}`}
    >
      <Text className="text-xs font-bold uppercase tracking-widest text-slate">
        {label}
      </Text>
      <Text
        accessibilityLabel={`${label}: ${formatMoney(valueCents)}`}
        className={`mt-2 text-3xl font-black tracking-tight ${valueClasses[tone]}`}
      >
        {formatMoney(valueCents)}
      </Text>
      <Text className="mt-2 text-sm leading-5 text-slate">{description}</Text>
    </View>
  );
}
