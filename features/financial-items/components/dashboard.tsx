import { Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { MetricCard } from '@/components/metric-card';
import { Screen } from '@/components/screen';
import { FinancialItemList } from '@/features/financial-items/components/financial-item-list';
import { calculateDashboardMetrics } from '@/features/financial-items/logic/dashboard';
import type { FinancialItem } from '@/types/financial-item';

interface DashboardProps {
  isRouteFocused?: boolean;
  items: FinancialItem[];
  onComplete: (id: string) => boolean;
  referenceDate: Date;
}

export function Dashboard({
  isRouteFocused = true,
  items,
  onComplete,
  referenceDate,
}: DashboardProps) {
  const metrics = calculateDashboardMetrics(items);

  return (
    <Screen>
      <AppHeader />

      <View className="mt-8 flex-row flex-wrap gap-3">
        <MetricCard
          description="Unused value in active perks"
          label="Available"
          tone="available"
          valueCents={metrics.availableCents}
        />
        <MetricCard
          description="Potential charges to prevent"
          label="At Risk"
          tone="risk"
          valueCents={metrics.atRiskCents}
        />
        <MetricCard
          description="Value protected or reclaimed"
          label="Clawed Back"
          tone="protected"
          valueCents={metrics.clawedBackCents}
        />
      </View>

      <View className="mb-4 mt-10">
        <Text className="text-2xl font-extrabold text-ink">
          Your next moves
        </Text>
        <Text className="mt-1 text-sm leading-5 text-slate">
          Prioritized by deadline and financial impact. Dates are shown as
          calendar dates.
        </Text>
      </View>

      <FinancialItemList
        isRouteFocused={isRouteFocused}
        items={items}
        onComplete={onComplete}
        referenceDate={referenceDate}
      />
    </Screen>
  );
}
