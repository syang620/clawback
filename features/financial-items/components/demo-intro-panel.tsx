import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { SectionHeading } from '@/components/page-heading';

export function DemoIntroPanel() {
  return (
    <View
      accessibilityLabel="How Clawback works"
      className="mt-6 flex-row flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-4"
    >
      <View className="min-w-0 flex-1 basis-72">
        <SectionHeading className="font-extrabold text-ink">
          Catch deadlines before money slips away
        </SectionHeading>
        <Text className="mt-1 text-sm leading-5 text-slate">
          Track trials, renewals, and unused perks, then strike tasks after you
          act to see what you protected. Clawback tracks actions—it does not
          cancel or redeem for you.
        </Text>
      </View>
      <Link href="/add" asChild>
        <Pressable
          accessibilityLabel="Add a financial task"
          accessibilityRole="link"
          className="min-h-11 justify-center rounded-xl border border-line px-4 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
        >
          <Text className="font-extrabold text-brand">Add a task →</Text>
        </Pressable>
      </Link>
    </View>
  );
}
