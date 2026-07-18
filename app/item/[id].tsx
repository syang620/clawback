import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Screen } from '@/components/screen';
import { FinancialItemDetail } from '@/features/financial-items/components/financial-item-detail';
import { useCompleteWithFeedback } from '@/features/financial-items/hooks/use-complete-with-feedback';
import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';

export default function FinancialItemDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getItem } = useFinancialItems();
  const completeItem = useCompleteWithFeedback();
  const item = typeof id === 'string' ? getItem(id) : null;

  return (
    <Screen>
      <AppHeader />
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        className="mt-6 min-h-11 justify-center self-start rounded-xl px-1 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/');
        }}
      >
        <Text className="font-extrabold text-brand">← Back</Text>
      </Pressable>

      {item ? (
        <FinancialItemDetail
          item={item}
          onComplete={completeItem}
          referenceDate={new Date()}
        />
      ) : (
        <View
          accessibilityLabel="Financial task not found"
          className="mt-8 items-center rounded-3xl border border-dashed border-line bg-surface px-6 py-12"
        >
          <Text className="text-center text-xl font-extrabold text-ink">
            We could not find that task.
          </Text>
          <Text className="mt-2 max-w-md text-center text-base leading-6 text-slate">
            It may no longer be part of this sample-data session.
          </Text>
          <Link href="/" asChild>
            <Pressable
              accessibilityRole="link"
              className="mt-5 min-h-11 justify-center rounded-xl bg-ink px-5 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
            >
              <Text className="font-extrabold text-white">Return Home</Text>
            </Pressable>
          </Link>
        </View>
      )}
    </Screen>
  );
}
