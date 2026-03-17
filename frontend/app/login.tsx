import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from './_layout';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const COLORS = {
  primary: '#8B5CF6',
  primaryDark: '#6D28D9',
  background: '#0A0A0F',
  surface: '#13131A',
  card: '#1C1C27',
  cardBorder: '#2D2D3A',
  text: '#FFFFFF',
  textSecondary: '#71717A',
  accent: '#22D3EE',
  accentPink: '#EC4899',
  success: '#10B981',
  error: '#EF4444',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: email.trim(),
        password: password.trim(),
      });

      await login(response.data.session_token, response.data);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = typeof window !== 'undefined' 
      ? window.location.origin + '/auth-callback'
      : `${BACKEND_URL}/auth-callback`;
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    
    if (Platform.OS === 'web') {
      window.location.href = authUrl;
    } else {
      Linking.openURL(authUrl);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.accentPink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="sparkles" size={40} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.appName}>CoachHabits</Text>
            <Text style={styles.tagline}>Construis des habitudes durables</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Connexion</Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={COLORS.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={COLORS.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.loginButtonWrapper}
              onPress={handleEmailLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.accentPink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.text} />
                ) : (
                  <Text style={styles.loginButtonText}>Se connecter</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
            >
              <Ionicons name="logo-google" size={20} color={COLORS.text} />
              <Text style={styles.googleButtonText}>Continuer avec Google</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Pas encore de compte ?</Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>S'inscrire</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '20',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeButton: {
    padding: 16,
  },
  loginButtonWrapper: {
    marginTop: 8,
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  loginButtonText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
  dividerText: {
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 10,
  },
  googleButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  registerText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
