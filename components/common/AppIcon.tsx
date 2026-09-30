import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { ColorValue } from 'react-native';

const iconMap = {
  home: { ios: 'house.fill', android: 'home' },
  library: { ios: 'books.vertical.fill', android: 'menu_book' },
  records: { ios: 'calendar', android: 'calendar_month' },
  insights: { ios: 'chart.bar.fill', android: 'insights' },
  settings: { ios: 'gearshape.fill', android: 'settings' },
  timer: { ios: 'clock.fill', android: 'timer' },
  bookmark: { ios: 'bookmark.fill', android: 'bookmark' },
  note: { ios: 'square.and.pencil', android: 'edit_note' },
  star: { ios: 'star.fill', android: 'star' },
  streak: { ios: 'flame.fill', android: 'local_fire_department' },
} as const satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>;

export type AppIconName = keyof typeof iconMap;

type AppIconProps = {
  name: AppIconName;
  color: ColorValue;
  size?: number;
};

export function AppIcon({ name, color, size = 22 }: AppIconProps) {
  const icon = iconMap[name];

  return (
    <SymbolView
      name={{ ios: icon.ios, android: icon.android, web: icon.android }}
      tintColor={color}
      size={size}
      style={{ width: size, height: size }}
    />
  );
}
