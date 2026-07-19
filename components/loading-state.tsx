import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = 'Loading your financial tasks…',
}: LoadingStateProps) {
  return (
    <View
      accessibilityLabel="Loading financial tasks"
      className="items-center p-8"
    >
      <ActivityIndicator color="#315EFB" />
      <Text className="mt-3 text-center text-sm text-slate">{message}</Text>
    </View>
  );
}
