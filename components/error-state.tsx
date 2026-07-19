import { Pressable, Text, View } from 'react-native';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({
  message = 'Please try again. Your information has not been changed.',
  onRetry,
  title = 'Could not load tasks',
}: ErrorStateProps) {
  return (
    <View
      accessibilityLabel={title}
      accessibilityRole="alert"
      className="rounded-3xl border border-risk/20 bg-red-50 p-6"
    >
      <Text className="font-extrabold text-risk">{title}</Text>
      <Text className="mt-2 text-sm leading-5 text-slate">{message}</Text>
      {onRetry && (
        <Pressable
          accessibilityRole="button"
          className="mt-4 min-h-11 justify-center self-start rounded-xl bg-ink px-5 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
          onPress={onRetry}
        >
          <Text className="font-extrabold text-white">Try again</Text>
        </Pressable>
      )}
    </View>
  );
}
