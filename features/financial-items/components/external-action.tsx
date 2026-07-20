import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { getSafeHttpsUrl } from '@/lib/urls';

interface ExternalActionProps {
  actionUrl: string | null;
  provider?: string | null;
}

export type ExternalActionOpenResult = 'opened' | 'invalid' | 'failed';

export async function openExternalActionPage(
  actionUrl: string | null,
  openUrl: (url: string) => Promise<unknown> = (url) => Linking.openURL(url),
): Promise<ExternalActionOpenResult> {
  const revalidatedActionUrl = getSafeHttpsUrl(actionUrl);
  if (!revalidatedActionUrl) return 'invalid';

  try {
    await openUrl(revalidatedActionUrl.href);
    return 'opened';
  } catch {
    return 'failed';
  }
}

export function ExternalAction({ actionUrl, provider }: ExternalActionProps) {
  const [hasOpenError, setHasOpenError] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const openingRef = useRef(false);
  const mountedRef = useRef(true);
  const safeActionUrl = getSafeHttpsUrl(actionUrl);
  const providerName = provider?.trim() || null;

  useEffect(
    () => () => {
      mountedRef.current = false;
      openingRef.current = false;
    },
    [],
  );

  if (!safeActionUrl) {
    return (
      <View
        accessibilityLabel="No action link saved"
        className="min-w-0 py-1 md:flex-1"
      >
        <Text className="font-extrabold text-slate">No action link saved</Text>
        <Text className="mt-1 text-sm leading-5 text-slate">
          Open the provider’s app or website manually.
        </Text>
      </View>
    );
  }

  const openActionPage = async () => {
    if (openingRef.current) return;

    openingRef.current = true;
    setIsOpening(true);
    setHasOpenError(false);
    try {
      const result = await openExternalActionPage(actionUrl);
      if (mountedRef.current && result !== 'opened') setHasOpenError(true);
    } finally {
      openingRef.current = false;
      if (mountedRef.current) setIsOpening(false);
    }
  };

  return (
    <View className="min-w-0 md:flex-1">
      <Pressable
        accessibilityHint={`Opens ${safeActionUrl.hostname} in your browser; Clawback does not take the financial action for you`}
        accessibilityLabel={`${hasOpenError ? 'Retry opening' : 'Open'} ${providerName ?? 'action page'} on ${safeActionUrl.hostname}`}
        accessibilityRole="link"
        accessibilityState={{ busy: isOpening, disabled: isOpening }}
        className="min-h-11 items-center justify-center rounded-xl bg-brand px-5 py-3 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
        disabled={isOpening}
        onPress={() => {
          void openActionPage();
        }}
      >
        <Text className="text-center font-extrabold text-white">
          {isOpening
            ? 'Opening…'
            : hasOpenError
              ? `Retry opening ${providerName ?? 'action page'}`
              : `Open ${providerName ?? 'action page'}`}
        </Text>
      </Pressable>
      <Text className="mt-2 text-xs font-semibold text-slate">
        {safeActionUrl.hostname} · External website
      </Text>
      <Text className="mt-1 text-xs leading-4 text-slate">
        Opens externally. Clawback does not take the action for you.
      </Text>
      {hasOpenError && (
        <View
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          className="mt-3 flex-row flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <Text className="min-w-[160px] flex-1 text-sm font-semibold leading-5 text-risk">
            We could not open this external action page. Try again when you are
            ready.
          </Text>
          <Pressable
            accessibilityLabel="Dismiss action page error"
            accessibilityRole="button"
            className="min-h-11 justify-center rounded-lg px-2 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-risk"
            onPress={() => setHasOpenError(false)}
          >
            <Text className="font-extrabold text-risk">Dismiss</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
