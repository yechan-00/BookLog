import { Tabs } from 'expo-router';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/common/AppIcon';
import { homeTheme } from '@/constants/homeTheme';

const ACTIVE = '#79543F';
const INACTIVE = '#96877D';

function tabIcon(name: AppIconName) {
  function TabBarIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return (
      <View style={styles.iconWrap}>
        <AppIcon name={name} color={color} size={22} />
        <View style={[styles.dot, focused ? styles.dotOn : styles.dotOff]} />
      </View>
    );
  }

  return TabBarIcon;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: homeTheme.surface,
          borderTopColor: homeTheme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          paddingTop: 6,
          elevation: 6,
          shadowColor: homeTheme.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
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

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotOn: {
    backgroundColor: ACTIVE,
  },
  dotOff: {
    backgroundColor: 'transparent',
  },
});
