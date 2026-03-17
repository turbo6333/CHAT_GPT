import React, { useEffect, useState, createContext, useContext } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const COLORS = {
  primary: '#8B5CF6',
  background: '#0A0A0F',
  surface: '#13131A',
  text: '#FFFFFF',
  textSecondary: '#71717A',
};

// Auth Context
interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  auth_type: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.log('Not authenticated');
      await AsyncStorage.removeItem('session_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string, userData: User) => {
    await AsyncStorage.setItem('session_token', token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (token) {
        await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('session_token');
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'auth-callback';

    if (!user && !inAuthGroup) {
      // Not logged in and not in auth group, redirect to login
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Logged in but in auth group, redirect to home
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View style={styles.container}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="auth-callback" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
