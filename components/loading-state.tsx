import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = 'Loading your financial tasks…',
}: LoadingStateProps) {
  return (
    <View
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      className="items-center p-8"
      role="status"
    >
      <ActivityIndicator color="#315EFB" />
      <Text className="mt-3 text-center text-sm text-slate">{message}</Text>
    </View>
  );
}
