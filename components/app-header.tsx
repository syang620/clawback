import { type Href, Link, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

interface NavigationLinkProps {
  href: '/' | '/activity';
  label: string;
}

function NavigationLink({ href, label }: NavigationLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href as Href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityState={{ selected: isActive }}
        className={`min-h-11 justify-center rounded-xl px-3 web:cursor-pointer web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand ${
          isActive ? 'bg-blue-50' : 'bg-transparent'
        }`}
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
  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between gap-4">
        <View className="min-w-0 flex-1">
          <Text className="text-3xl font-black tracking-tight text-ink">
            CLAWBACK
          </Text>
          <Text className="mt-1 text-base text-slate">
            Stop leaving money on the table.
          </Text>
        </View>
        <View className="rounded-full border border-brand/20 bg-blue-50 px-3 py-2">
          <Text className="text-xs font-bold text-brand">Sample data</Text>
        </View>
      </View>

      <View
        accessibilityLabel="Primary navigation"
        className="flex-row gap-1 self-start rounded-2xl border border-line bg-surface p-1"
      >
        <NavigationLink href="/" label="Home" />
        <NavigationLink href="/activity" label="Activity" />
      </View>
    </View>
  );
}
