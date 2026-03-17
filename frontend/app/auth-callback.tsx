import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useAuth } from './_layout';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const COLORS = {
  primary: '#8B5CF6',
  background: '#0A0A0F',
  text: '#FFFFFF',
  textSecondary: '#71717A',
  accentPink: '#EC4899',
};

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Get session_id from URL hash
        let sessionId = '';
        
        if (typeof window !== 'undefined') {
          const hash = window.location.hash;
          const match = hash.match(/session_id=([^&]+)/);
          if (match) {
            sessionId = match[1];
          }
        }

        if (!sessionId) {
          console.error('No session_id found');
          router.replace('/login');
          return;
        }

        // Exchange session_id for session token
        const response = await axios.post(`${BACKEND_URL}/api/auth/google/session`, {
          session_id: sessionId,
        });

        await login(response.data.session_token, response.data);
        
        // Clear the hash and redirect
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', window.location.pathname);
        }
        
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/login');
      }
    };

    processAuth();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.accentPink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logoGradient}
      >
        <Ionicons name="sparkles" size={40} color="#FFFFFF" />
      </LinearGradient>
      <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
      <Text style={styles.text}>Connexion en cours...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
});
