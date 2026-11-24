import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { View, Platform } from 'react-native';

export default function TabLayout() {
  const { theme } = useTheme();

  const tabBarBg = theme.colors.surface;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primaryContent,
        tabBarInactiveTintColor: theme.colors.textSubtle,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: theme.colors.borderSubtle,
          height: Platform.OS === 'ios' ? 80 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        // Active tab gets an indigo pill background
        tabBarItemStyle: { borderRadius: 16 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={
                focused
                  ? {
                      backgroundColor: theme.colors.primary,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      marginBottom: -2,
                    }
                  : undefined
              }
            >
              <Ionicons
                name="home"
                size={focused ? size - 2 : size}
                color={focused ? '#FFFFFF' : (color as string)}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="albums"
        options={{
          title: 'Albums',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={
                focused
                  ? {
                      backgroundColor: theme.colors.primary,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      marginBottom: -2,
                    }
                  : undefined
              }
            >
              <Ionicons
                name="grid"
                size={focused ? size - 2 : size}
                color={focused ? '#FFFFFF' : (color as string)}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={
                focused
                  ? {
                      backgroundColor: theme.colors.primary,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      marginBottom: -2,
                    }
                  : undefined
              }
            >
              <Ionicons
                name="cloud"
                size={focused ? size - 2 : size}
                color={focused ? '#FFFFFF' : (color as string)}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={
                focused
                  ? {
                      backgroundColor: theme.colors.primary,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      marginBottom: -2,
                    }
                  : undefined
              }
            >
              <Ionicons
                name="options"
                size={focused ? size - 2 : size}
                color={focused ? '#FFFFFF' : (color as string)}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
