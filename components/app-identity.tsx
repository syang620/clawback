import { Text, View } from 'react-native';

interface AppIdentityProps {
  mode?: 'demo' | 'connected' | null;
}

export function AppIdentity({ mode }: AppIdentityProps) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <View className="min-w-0 flex-1">
        <Text className="text-3xl font-black tracking-tight text-ink">
          CLAWBACK
        </Text>
        <Text className="mt-1 text-base text-slate">
          Stop leaving money on the table.
        </Text>
      </View>
      {mode && (
        <View className="rounded-full border border-brand/20 bg-blue-50 px-3 py-2">
          <Text className="text-xs font-bold text-brand">
            {mode === 'connected' ? 'Connected' : 'Local demo'}
          </Text>
        </View>
      )}
    </View>
  );
}
