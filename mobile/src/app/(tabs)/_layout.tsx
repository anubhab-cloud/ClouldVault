import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette, shadows3D } from '@/theme';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  albums: 'grid-outline',
  accounts: 'cloud-outline',
  settings: 'options-outline',
};

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  albums: 'Albums',
  accounts: 'Accounts',
  settings: 'Settings',
};

type CustomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

function FloatingTabBar({ state, descriptors, emitter, navigateToTab }: CustomTabBarProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.floatingWrapper, { bottom: Platform.OS === 'ios' ? 22 : 14 }]} pointerEvents="box-none">
      <View style={[styles.tabBarContainer, { backgroundColor: theme.colors.surface }, shadows3D.card]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const iconName = TAB_ICONS[route.name] || 'ellipse-outline';
          const label = TAB_LABELS[route.name] || descriptors[route.key]?.options?.title || route.name;

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          if (isFocused) {
            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.9}
                onPress={onPress}
                style={styles.tabItem}
              >
                <LinearGradient
                  colors={palette.indigoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.activePill, shadows3D.button]}
                >
                  <Ionicons name={iconName} size={20} color="#FFFFFF" />
                  <Text style={styles.activeLabel}>{label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.7}
              onPress={onPress}
              style={styles.tabItem}
            >
              <View style={styles.inactivePill}>
                <Ionicons name={iconName} size={20} color={theme.colors.textMuted} />
                <Text style={[styles.inactiveLabel, { color: theme.colors.textMuted }]}>{label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="albums" options={{ title: 'Albums' }} />
      <Tabs.Screen name="accounts" options={{ title: 'Accounts' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    width: '90%' as const,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 18,
    borderBottomWidth: 2,
    borderBottomColor: '#3A3EB5',
  },
  activeLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  inactivePill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  inactiveLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
