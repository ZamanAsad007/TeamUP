import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

import { MarketplaceScreen } from '../screens/Marketplace/MarketplaceScreen';
import { MatchingScreen } from '../screens/Matching/MatchingScreen';
import { CreateProjectScreen } from '../screens/Marketplace/CreateProjectScreen';
import { IdeaHubScreen } from '../screens/IdeaHub/IdeaHubScreen';
import { MoreScreen } from '../screens/More/MoreScreen';

export type MainTabParamList = {
  Projects: undefined;
  Matching: undefined;
  Create: undefined;
  IdeaHub: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 58 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Projects"
        component={MarketplaceScreen}
        options={{
          title: 'Projects',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🚀</Text>,
        }}
      />
      <Tab.Screen
        name="Matching"
        component={MatchingScreen}
        options={{
          title: 'Matching',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🤝</Text>,
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateProjectScreen}
        options={{
          title: 'Create',
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View
              style={[
                styles.createButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <Text style={styles.createButtonText}>+</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="IdeaHub"
        component={IdeaHubScreen}
        options={{
          title: 'Ideas',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💡</Text>,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>☰</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 14 : 10,
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '400',
    lineHeight: 28,
    textAlign: 'center',
  },
});
