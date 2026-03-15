import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#8B5CF6',
  primaryDark: '#6D28D9',
  background: '#0A0A0F',
  surface: '#13131A',
  card: '#1C1C27',
  text: '#FFFFFF',
  textSecondary: '#71717A',
  accent: '#22D3EE',
  success: '#10B981',
  warning: '#FBBF24',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textSecondary,
            tabBarLabelStyle: styles.tabLabel,
            tabBarItemStyle: styles.tabItem,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Accueil',
              tabBarIcon: ({ color, focused }) => (
                <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                  <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="habits"
            options={{
              title: 'Habitudes',
              tabBarIcon: ({ color, focused }) => (
                <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                  <Ionicons name={focused ? "checkmark-circle" : "checkmark-circle-outline"} size={22} color={color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="coach"
            options={{
              title: 'Coach',
              tabBarIcon: ({ color, focused }) => (
                <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                  <Ionicons name={focused ? "sparkles" : "sparkles-outline"} size={22} color={color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profil',
              tabBarIcon: ({ color, focused }) => (
                <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                  <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
                </View>
              ),
            }}
          />
        </Tabs>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 0,
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabItem: {
    paddingTop: 4,
  },
  iconContainer: {
    width: 40,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
});
