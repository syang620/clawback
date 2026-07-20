import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

interface DemoControlsProps {
  isBlocked?: boolean;
  isResetting?: boolean;
  mode: 'demo' | 'connected';
  onResetLocalDemo?: () => Promise<boolean>;
}

export function DemoControls({
  isBlocked = false,
  isResetting = false,
  mode,
  onResetLocalDemo,
}: DemoControlsProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [resetFailed, setResetFailed] = useState(false);
  const submittingRef = useRef(false);

  if (mode === 'connected') {
    return (
      <View
        accessibilityLabel="Connected demo guidance"
        className="mt-10 border-l-2 border-line py-1 pl-4 pr-2"
      >
        <Text className="font-extrabold text-ink">Clean demo session</Text>
        <Text className="mt-2 text-sm leading-5 text-slate">
          Connected records persist for this anonymous session. For a clean
          judge demo, open Clawback in a fresh private or incognito browser
          session. It creates a separate anonymous session; the original records
          remain unchanged but are unavailable from the new session.
        </Text>
      </View>
    );
  }

  const confirmReset = async () => {
    if (
      submittingRef.current ||
      isBlocked ||
      isResetting ||
      !onResetLocalDemo
    ) {
      return;
    }
    submittingRef.current = true;
    setResetFailed(false);

    try {
      const didReset = await onResetLocalDemo();
      if (!didReset) setResetFailed(true);
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <View className="mt-10 rounded-2xl border border-line bg-surface px-5 py-4">
      <Text className="font-extrabold text-ink">Demo controls</Text>
      {!isConfirming ? (
        <>
          <Text className="mt-2 text-sm leading-5 text-slate">
            Restore the Local demo to its three starter tasks without reloading
            the app.
          </Text>
          <Pressable
            accessibilityLabel="Reset Local demo"
            accessibilityRole="button"
            accessibilityState={{ disabled: isBlocked }}
            className="mt-4 min-h-11 justify-center self-start rounded-xl border border-line px-4 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
            disabled={isBlocked}
            onPress={() => {
              setResetFailed(false);
              setIsConfirming(true);
            }}
          >
            <Text className="font-extrabold text-ink">Reset Local demo</Text>
          </Pressable>
          {isBlocked && (
            <Text className="mt-2 text-xs leading-4 text-slate">
              Finish the current task update before resetting the Local demo.
            </Text>
          )}
        </>
      ) : (
        <View
          accessibilityLabel="Confirm Local demo reset"
          accessibilityRole="alert"
          className="mt-3 rounded-xl border border-risk/20 bg-red-50 p-4"
        >
          <Text className="font-extrabold text-ink">
            Replace this Local demo?
          </Text>
          <Text className="mt-2 text-sm leading-5 text-slate">
            This replaces local tasks, completed history, metrics, pending Undo,
            and local changes with the canonical three starter tasks.
          </Text>
          <View className="mt-4 flex-row flex-wrap gap-3">
            <Pressable
              accessibilityLabel="Confirm Local demo reset"
              accessibilityRole="button"
              accessibilityState={{
                busy: isResetting,
                disabled: isBlocked || isResetting,
              }}
              className="min-h-11 justify-center rounded-xl bg-risk px-4 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-risk"
              disabled={isBlocked || isResetting}
              onPress={() => {
                void confirmReset();
              }}
            >
              <Text className="font-extrabold text-white">
                {isResetting ? 'Resetting…' : 'Reset demo'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Cancel Local demo reset"
              accessibilityRole="button"
              accessibilityState={{ disabled: isResetting }}
              className="min-h-11 justify-center rounded-xl px-3 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
              disabled={isResetting}
              onPress={() => {
                setResetFailed(false);
                setIsConfirming(false);
              }}
            >
              <Text className="font-extrabold text-slate">Cancel</Text>
            </Pressable>
          </View>
          {resetFailed && (
            <View
              accessibilityLiveRegion="assertive"
              accessibilityRole="alert"
              className="mt-3"
            >
              <Text className="text-sm font-semibold leading-5 text-risk">
                We could not reset the Local demo. Nothing was replaced. Try
                again after any task update finishes.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
