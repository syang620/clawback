import { type Href, Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Screen } from '@/components/screen';
import { formatAbsoluteDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import type { FinancialItem } from '@/types/financial-item';

interface ActivityProps {
  items: FinancialItem[];
}

function activityTimestamp(item: FinancialItem): number {
  const timestamp = Date.parse(item.completedAt ?? item.dueAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function Activity({ items }: ActivityProps) {
  const activityItems = items
    .filter((item) => item.status === 'completed' || item.status === 'expired')
    .slice()
    .sort((left, right) => {
      const timestampDifference =
        activityTimestamp(right) - activityTimestamp(left);
      return timestampDifference || left.id.localeCompare(right.id);
    });

  return (
    <Screen>
      <AppHeader />

      <View className="mb-4 mt-10">
        <Text className="text-2xl font-extrabold text-ink">Activity</Text>
        <Text className="mt-1 text-sm leading-5 text-slate">
          A record of tasks you struck and value you protected or reclaimed.
        </Text>
      </View>

      {activityItems.length === 0 ? (
        <View
          accessibilityLabel="No completed financial tasks"
          className="items-center rounded-3xl border border-dashed border-line bg-surface px-6 py-12"
        >
          <Text className="text-center text-xl font-extrabold text-ink">
            Your first strike will show up here.
          </Text>
          <Text className="mt-2 max-w-md text-center text-base leading-6 text-slate">
            Complete a task from Home when you have taken the action yourself.
          </Text>
        </View>
      ) : (
        <View className="gap-4">
          {activityItems.map((item) => {
            const amount =
              item.kind === 'perk' ? item.valueCents : item.chargeAmountCents;
            const amountLabel =
              item.status === 'completed'
                ? item.kind === 'perk'
                  ? 'reclaimed value'
                  : 'protected value'
                : item.kind === 'perk'
                  ? 'expired value'
                  : 'potential charge';

            return (
              <View
                key={item.id}
                className="rounded-3xl border border-line bg-surface p-5"
              >
                <Text className="text-sm font-semibold text-slate">
                  {item.provider ?? 'Provider not specified'}
                </Text>
                <View className="mt-1 flex-row flex-wrap items-start justify-between gap-4">
                  <Text className="min-w-0 flex-1 text-xl font-extrabold leading-7 text-ink">
                    {item.title}
                  </Text>
                  <View className="items-end">
                    <Text
                      className={`text-2xl font-black ${
                        item.status === 'completed'
                          ? 'text-positive'
                          : 'text-slate'
                      }`}
                    >
                      {formatMoney(amount)}
                    </Text>
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate">
                      {amountLabel}
                    </Text>
                  </View>
                </View>
                <Text className="mt-4 text-sm font-semibold text-slate">
                  {item.status === 'completed'
                    ? `Completed ${formatAbsoluteDate(item.completedAt ?? item.updatedAt)}`
                    : `Expired ${formatAbsoluteDate(item.dueAt)}`}
                </Text>
                <Link
                  href={`/item/${encodeURIComponent(item.id)}` as Href}
                  asChild
                >
                  <Pressable
                    accessibilityLabel={`View details for ${item.title}`}
                    accessibilityRole="link"
                    className="mt-4 min-h-11 justify-center self-start rounded-xl border border-line px-4 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
                  >
                    <Text className="font-extrabold text-ink">
                      View details
                    </Text>
                  </Pressable>
                </Link>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
