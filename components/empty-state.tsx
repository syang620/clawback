import { Text, View } from 'react-native';

export function EmptyState() {
  return (
    <View
      accessibilityLabel="No active financial tasks"
      className="items-center rounded-3xl border border-dashed border-line bg-surface px-6 py-12"
    >
      <Text className="text-center text-xl font-extrabold text-ink">
        Nothing is slipping through the cracks.
      </Text>
      <Text className="mt-2 max-w-md text-center text-base leading-6 text-slate">
        Your active perks, trials, and subscriptions will appear here.
      </Text>
    </View>
  );
}
