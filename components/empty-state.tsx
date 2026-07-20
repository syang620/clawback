import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { SectionHeading } from '@/components/page-heading';

interface EmptyStateProps {
  showActivityLink?: boolean;
}

export function EmptyState({ showActivityLink = false }: EmptyStateProps) {
  return (
    <View
      accessibilityLabel="No active financial tasks"
      className="items-center rounded-3xl border border-dashed border-line bg-surface px-6 py-12"
    >
      <SectionHeading className="text-center text-xl font-extrabold text-ink">
        No active financial tasks remain.
      </SectionHeading>
      <Text className="mt-2 max-w-md text-center text-base leading-6 text-slate">
        Completed and expired tasks stay in Activity. Add a task when there is
        something new to track.
      </Text>
      <View className="mt-5 flex-row flex-wrap justify-center gap-3">
        <Link href="/add" asChild>
          <Pressable
            accessibilityLabel="Add a financial task"
            accessibilityRole="link"
            className="min-h-11 justify-center rounded-xl bg-ink px-5 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
          >
            <Text className="font-extrabold text-white">Add a task</Text>
          </Pressable>
        </Link>
        {showActivityLink && (
          <Link href="/activity" asChild>
            <Pressable
              accessibilityLabel="View Activity"
              accessibilityRole="link"
              className="min-h-11 justify-center rounded-xl px-3 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
            >
              <Text className="font-extrabold text-brand">View Activity</Text>
            </Pressable>
          </Link>
        )}
      </View>
    </View>
  );
}
