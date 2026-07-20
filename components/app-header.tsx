import { type Href, Link, usePathname } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';

import { AppIdentity } from '@/components/app-identity';
import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';

interface NavigationLinkProps {
  href: '/' | '/activity' | '/add';
  label: string;
}

function NavigationLink({ href, label }: NavigationLinkProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

  return (
    <Link href={href as Href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityState={
          Platform.OS === 'web' ? undefined : { selected: isActive }
        }
        className={`min-h-11 justify-center rounded-xl px-3 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand ${
          isActive ? 'bg-blue-50' : 'bg-transparent'
        }`}
        {...(Platform.OS === 'web' && isActive
          ? ({ 'aria-current': 'page' } as const)
          : {})}
      >
        <Text
          className={`text-sm font-extrabold ${isActive ? 'text-brand' : 'text-slate'}`}
        >
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

export function AppHeader() {
  const { mode } = useFinancialItems();

  return (
    <View className="gap-4">
      <AppIdentity mode={mode} />

      <View
        accessibilityLabel="Primary navigation"
        className="flex-row gap-1 self-start rounded-2xl border border-line bg-surface p-1"
        role="navigation"
      >
        <NavigationLink href="/" label="Home" />
        <NavigationLink href="/activity" label="Activity" />
        <NavigationLink href="/add" label="+ Add task" />
      </View>
    </View>
  );
}
