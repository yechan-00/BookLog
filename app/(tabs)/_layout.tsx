import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/common/AppIcon';
import { colors } from '@/constants/colors';

function tabIcon(name: AppIconName) {
  return ({ color }: { color: ColorValue }) => <AppIcon name={name} color={color} size={22} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: tabIcon('home'),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: '서재',
          tabBarIcon: tabIcon('library'),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: '기록',
          tabBarIcon: tabIcon('records'),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: '인사이트',
          tabBarIcon: tabIcon('insights'),
        }}
      />
    </Tabs>
  );
}
