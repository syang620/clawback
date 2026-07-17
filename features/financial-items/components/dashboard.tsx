import { Text, View } from 'react-native';

import { MetricCard } from '@/components/metric-card';
import { Screen } from '@/components/screen';
import { FinancialItemList } from '@/features/financial-items/components/financial-item-list';
import { calculateDashboardMetrics } from '@/features/financial-items/logic/dashboard';
import type { FinancialItem } from '@/types/financial-item';

interface DashboardProps {
  items: FinancialItem[];
}

export function Dashboard({ items }: DashboardProps) {
  const metrics = calculateDashboardMetrics(items);

  return (
    <Screen>
      <View className="flex-row items-center justify-between gap-4">
        <View className="min-w-0 flex-1">
          <Text className="text-3xl font-black tracking-tight text-ink">
            CLAWBACK
          </Text>
          <Text className="mt-1 text-base text-slate">
            Stop leaving money on the table.
          </Text>
        </View>
        <View className="rounded-full border border-brand/20 bg-blue-50 px-3 py-2">
          <Text className="text-xs font-bold text-brand">Sample data</Text>
        </View>
      </View>

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
          Start with the closest deadline. Dates are shown as calendar dates.
        </Text>
      </View>

      <FinancialItemList items={items} />
    </Screen>
  );
}
