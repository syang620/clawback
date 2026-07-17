import { ActivityIndicator, Text, View } from 'react-native';

export function LoadingState() {
  return (
    <View
      accessibilityLabel="Loading financial tasks"
      className="items-center p-8"
    >
      <ActivityIndicator color="#315EFB" />
      <Text className="mt-3 text-sm text-slate">
        Loading your financial tasks…
      </Text>
    </View>
  );
}
