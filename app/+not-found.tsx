import { Link, Stack, useIsFocused } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { PageHeading } from '@/components/page-heading';
import { Screen } from '@/components/screen';

export default function NotFoundRoute() {
  const isRouteFocused = useIsFocused();

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found | Clawback' }} />
      <Screen>
        <AppHeader />
        <View className="mt-10 items-center rounded-3xl border border-dashed border-line bg-surface px-6 py-12">
          <PageHeading
            active={isRouteFocused}
            className="text-center text-2xl font-extrabold text-ink"
          >
            Page not found
          </PageHeading>
          <Text className="mt-2 max-w-md text-center text-base leading-6 text-slate">
            This destination is not available in Clawback.
          </Text>
          <Link href="/" asChild>
            <Pressable
              accessibilityLabel="Return Home"
              accessibilityRole="link"
              className="mt-5 min-h-11 justify-center rounded-xl bg-ink px-5 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
            >
              <Text className="font-extrabold text-white">Return Home</Text>
            </Pressable>
          </Link>
        </View>
      </Screen>
    </>
  );
}
