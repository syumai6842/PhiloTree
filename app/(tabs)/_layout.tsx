import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { PhiloTreeColors } from '../../constants/Colors';

function TabBarIcon({ name, color }: { name: any; color: string }) {
  return <IconSymbol name={name} size={28} color={color} />;
}

export default function TabLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: PhiloTreeColors.nodeNormal,
          tabBarInactiveTintColor: PhiloTreeColors.textMuted,
          tabBarStyle: {
            backgroundColor: PhiloTreeColors.backgroundSecondary,
            borderTopColor: PhiloTreeColors.border,
          },
          headerStyle: {
            backgroundColor: PhiloTreeColors.backgroundSecondary,
          },
          headerTintColor: PhiloTreeColors.textPrimary,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: '思想マップ',
            tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: '探索',
            tabBarIcon: ({ color }) => <TabBarIcon name="magnifyingglass" color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
