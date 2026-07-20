import { Pressable, Text, View } from 'react-native';

import { DemoControls } from '@/features/financial-items/components/demo-controls';
import type { FinancialItemKind } from '@/types/financial-item';

interface AddMenuProps {
  isLocalDemoResetBlocked?: boolean;
  isResettingLocalDemo?: boolean;
  onCancel: () => void;
  onExtractEmail: () => void;
  onResetLocalDemo?: () => Promise<boolean>;
  onSelect: (kind: FinancialItemKind) => void;
  mode: 'demo' | 'connected';
}

const choices: Array<{
  description: string;
  kind: FinancialItemKind;
  label: string;
}> = [
  {
    kind: 'trial',
    label: 'Trial',
    description: 'Catch a cancellation deadline before a potential charge.',
  },
  {
    kind: 'perk',
    label: 'Perk',
    description: 'Use available value before a benefit expires.',
  },
  {
    kind: 'subscription',
    label: 'Subscription',
    description: 'Review a renewal or cancellation deadline.',
  },
];

export function AddMenu({
  isLocalDemoResetBlocked = false,
  isResettingLocalDemo = false,
  mode,
  onCancel,
  onExtractEmail,
  onResetLocalDemo,
  onSelect,
}: AddMenuProps) {
  return (
    <View className="mx-auto mt-8 w-full max-w-2xl">
      <Text accessibilityRole="header" className="text-3xl font-black text-ink">
        Add a financial task
      </Text>
      <Text className="mt-2 text-base leading-6 text-slate">
        Choose what you want to track. You can review every detail before
        saving.
      </Text>

      <View className="mt-7 gap-3">
        {mode === 'connected' ? (
          <Pressable
            accessibilityHint="Paste an email, review the extracted task, and choose whether to save it"
            accessibilityLabel="Extract from email"
            accessibilityRole="button"
            className="min-h-24 rounded-2xl border border-brand bg-blue-50 px-5 py-4 web:cursor-pointer web:hover:border-ink web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
            onPress={onExtractEmail}
          >
            <Text className="text-lg font-extrabold text-brand">
              Extract from email
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate">
              Paste a financial email, then review every extracted field before
              saving.
            </Text>
          </Pressable>
        ) : (
          <View
            accessibilityLabel="Email extraction requires Connected mode"
            className="rounded-2xl border border-line bg-surface px-5 py-4"
          >
            <Text className="text-sm leading-5 text-slate">
              Email extraction requires Connected mode. You can still add a task
              manually.
            </Text>
          </View>
        )}

        {choices.map((choice) => (
          <Pressable
            accessibilityHint={choice.description}
            accessibilityLabel={`Add a ${choice.label.toLowerCase()}`}
            accessibilityRole="button"
            className="min-h-24 rounded-2xl border border-line bg-surface px-5 py-4 web:cursor-pointer web:hover:border-brand web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
            key={choice.kind}
            onPress={() => onSelect(choice.kind)}
          >
            <Text className="text-lg font-extrabold text-ink">
              {choice.label}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate">
              {choice.description}
            </Text>
          </Pressable>
        ))}
      </View>

      <DemoControls
        isBlocked={isLocalDemoResetBlocked}
        isResetting={isResettingLocalDemo}
        mode={mode}
        onResetLocalDemo={onResetLocalDemo}
      />

      <Pressable
        accessibilityRole="button"
        className="mt-6 min-h-11 justify-center self-start rounded-xl px-1 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand"
        onPress={onCancel}
      >
        <Text className="font-extrabold text-slate">Cancel</Text>
      </Pressable>
    </View>
  );
}
