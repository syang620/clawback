import { Pressable, Text, View } from 'react-native';

interface MutationErrorProps {
  message: string;
  onDismiss: () => void;
}

export function MutationError({ message, onDismiss }: MutationErrorProps) {
  return (
    <View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      className="mt-4 flex-row items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
    >
      <Text className="min-w-0 flex-1 text-sm font-semibold leading-5 text-risk">
        {message}
      </Text>
      <Pressable
        accessibilityLabel="Dismiss error"
        accessibilityRole="button"
        className="min-h-11 justify-center rounded-lg px-2 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-risk"
        onPress={onDismiss}
      >
        <Text className="font-extrabold text-risk">Dismiss</Text>
      </Pressable>
    </View>
  );
}
