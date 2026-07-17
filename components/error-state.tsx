import { Text, View } from 'react-native';

export function ErrorState() {
  return (
    <View
      accessibilityLabel="Could not load financial tasks"
      className="rounded-3xl border border-risk/20 bg-red-50 p-6"
    >
      <Text className="font-extrabold text-risk">Could not load tasks</Text>
      <Text className="mt-2 text-sm leading-5 text-slate">
        Please try again. Your information has not been changed.
      </Text>
    </View>
  );
}
