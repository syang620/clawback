import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps extends PropsWithChildren {
  keyboardAware?: boolean;
}

export function Screen({ children, keyboardAware = false }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScrollView
        automaticallyAdjustKeyboardInsets={keyboardAware}
        className="flex-1"
        contentContainerClassName="grow"
        keyboardShouldPersistTaps={keyboardAware ? 'handled' : 'never'}
      >
        <View className="mx-auto w-full max-w-5xl flex-1 px-5 pb-12 pt-5 web:px-8">
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
