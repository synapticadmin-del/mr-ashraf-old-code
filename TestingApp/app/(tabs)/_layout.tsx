import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGetTabsConfigQuery } from '@/store/api/apiSlice';
import { MaterialIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TAB_SCREENS = ['home', 'profile', 'exams', 'chats', 'challenge', 'mistakes', 'common-mistakes'] as const;

const DEFAULT_TABS: Record<string, { titleAr: string; icon: string }> = {
  home: { titleAr: 'الرئيسية', icon: 'home' },
  profile: { titleAr: 'الملف الشخصي', icon: 'person' },
  exams: { titleAr: 'الامتحانات', icon: 'assignment' },
  chats: { titleAr: 'المحادثات', icon: 'chat' },
  challenge: { titleAr: 'التحدي', icon: 'emoji-events' },
  mistakes: { titleAr: 'الأخطاء', icon: 'error-outline' },
  'common-mistakes': { titleAr: 'الأخطاء الشائعة', icon: 'warning' },
};

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { data: tabsConfigData } = useGetTabsConfigQuery();

  const tabConfigByKey = useMemo(() => {
    const map: Record<string, { titleAr: string; icon: string; isVisible: boolean; order: number }> = {};
    const tabs = tabsConfigData?.data?.tabs ?? [];
    tabs.forEach((t) => {
      map[t.key] = { titleAr: t.titleAr, icon: t.icon, isVisible: t.isVisible, order: t.order };
    });
    return map;
  }, [tabsConfigData]);

  const visibleRoutesOrdered = useMemo(() => {
    return [...TAB_SCREENS]
      .filter((name) => {
        const config = tabConfigByKey[name];
        return config === undefined ? true : config.isVisible;
      })
      .sort((a, b) => {
        const orderA = tabConfigByKey[a]?.order ?? 999;
        const orderB = tabConfigByKey[b]?.order ?? 999;
        return orderA - orderB;
      });
  }, [tabConfigByKey]);

  const getTitleAndIcon = (name: string) => {
    const config = tabConfigByKey[name];
    const fallback = DEFAULT_TABS[name];
    return {
      title: config?.titleAr ?? fallback?.titleAr ?? name,
      icon: (config?.icon ?? fallback?.icon ?? 'help') as keyof typeof MaterialIcons.glyphMap,
    };
  };

  const renderTabBar = (props: BottomTabBarProps) => {
    const { state, descriptors, navigation } = props;
    const barBg = themeColors.tabBar;
    const borderColor = themeColors.icon + '30';

    return (
      <View style={[styles.tabBar, { backgroundColor: barBg, borderTopColor: borderColor }]}>
        <View style={styles.tabBarContent}>
          {visibleRoutesOrdered.map((routeName) => {
            const route = state.routes.find((r) => r.name === routeName);
            if (!route) return null;
            const { options } = descriptors[route.key];
            const focused = state.index === state.routes.findIndex((r) => r.key === route.key);
            const { title, icon } = getTitleAndIcon(routeName);
            const color = focused ? themeColors.tint : themeColors.icon;

            return (
              <TouchableOpacity
                key={route.key}
                style={styles.tabItem}
                onPress={() => navigation.navigate(route.name)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={icon as keyof typeof MaterialIcons.glyphMap}
                  size={24}
                  color={color}
                />
                <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
                  {title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Tabs
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
      }}
    >
      {TAB_SCREENS.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ title: getTitleAndIcon(name).title }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 24,
    paddingTop: 8,
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    minWidth: 64,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});
