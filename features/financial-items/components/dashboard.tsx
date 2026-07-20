import { Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { MetricCard } from '@/components/metric-card';
import { Screen } from '@/components/screen';
import { DemoIntroPanel } from '@/features/financial-items/components/demo-intro-panel';
import { FinancialItemList } from '@/features/financial-items/components/financial-item-list';
import type {
  FinancialItemsMutationError,
  FinancialItemPendingOperation,
} from '@/features/financial-items/hooks/use-financial-items';
import { calculateDashboardMetrics } from '@/features/financial-items/logic/dashboard';
import type { FinancialItem } from '@/types/financial-item';

interface DashboardProps {
  isRouteFocused?: boolean;
  items: FinancialItem[];
  mutationErrors?: FinancialItemsMutationError[];
  onComplete: (id: string) => Promise<boolean>;
  onDismissError?: (errorId: string) => void;
  pendingItemOperations?: Readonly<
    Record<string, FinancialItemPendingOperation>
  >;
  referenceDate: Date;
  showPristineIntro?: boolean;
}

export function Dashboard({
  isRouteFocused = true,
  items,
  mutationErrors,
  onComplete,
  onDismissError,
  pendingItemOperations,
  referenceDate,
  showPristineIntro = false,
}: DashboardProps) {
  const metrics = calculateDashboardMetrics(items);

  return (
    <Screen>
      <AppHeader />

      {showPristineIntro && <DemoIntroPanel />}

      <View className="mt-8 flex-row flex-wrap gap-3">
        <MetricCard
          className="min-w-[150px] basis-[150px]"
          description="Unused value in active perks"
          label="Available"
          tone="available"
          valueCents={metrics.availableCents}
        />
        <MetricCard
          className="min-w-[150px] basis-[150px]"
          description="Potential charges to prevent"
          label="At Risk"
          tone="risk"
          valueCents={metrics.atRiskCents}
        />
        <MetricCard
          className="basis-full md:min-w-[150px] md:basis-[150px]"
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
        mutationErrors={mutationErrors}
        onComplete={onComplete}
        onDismissError={onDismissError}
        pendingItemOperations={pendingItemOperations}
        referenceDate={referenceDate}
      />
    </Screen>
  );
}
