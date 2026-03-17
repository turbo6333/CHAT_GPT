import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useAuth } from '../_layout';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const COLORS = {
  primary: '#8B5CF6',
  primaryDark: '#6D28D9',
  primaryLight: '#A78BFA',
  background: '#0A0A0F',
  surface: '#13131A',
  card: '#1C1C27',
  cardBorder: '#2D2D3A',
  text: '#FFFFFF',
  textSecondary: '#71717A',
  accent: '#22D3EE',
  accentPink: '#EC4899',
  success: '#10B981',
  warning: '#FBBF24',
  error: '#EF4444',
};

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; gradient: string[] }> = {
  sport: { icon: 'fitness', color: '#EF4444', gradient: ['#EF4444', '#F97316'] },
  study: { icon: 'book', color: '#3B82F6', gradient: ['#3B82F6', '#8B5CF6'] },
  health: { icon: 'heart', color: '#10B981', gradient: ['#10B981', '#22D3EE'] },
  productivity: { icon: 'rocket', color: '#FBBF24', gradient: ['#FBBF24', '#F97316'] },
};

const CATEGORY_LABELS: Record<string, string> = {
  sport: 'Sport',
  study: 'Études',
  health: 'Santé',
  productivity: 'Productivité',
};

interface Profile {
  id: string;
  name: string;
  notification_time: string;
}

interface Stats {
  total_habits: number;
  total_completions: number;
  total_streaks: number;
  average_mood_7days: number;
  categories: Record<string, number>;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTime, setEditTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/profile`),
        axios.get(`${BACKEND_URL}/api/stats`),
      ]);
      setProfile(profileRes.data);
      setStats(statsRes.data);
      setEditName(profileRes.data.name);
      setEditTime(profileRes.data.notification_time);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom');
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${BACKEND_URL}/api/profile`, {
        name: editName.trim(),
        notification_time: editTime,
      });
      setProfile((prev) =>
        prev ? { ...prev, name: editName.trim(), notification_time: editTime } : null
      );
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.primary + '30', COLORS.accentPink + '20']}
          style={styles.loadingIconBg}
        >
          <Ionicons name="person" size={32} color={COLORS.primary} />
        </LinearGradient>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const statsData = [
    { icon: 'checkmark-circle', label: 'Habitudes', value: stats?.total_habits || 0, color: COLORS.success, gradient: [COLORS.success, '#34D399'] },
    { icon: 'flame', label: 'Série totale', value: stats?.total_streaks || 0, color: COLORS.warning, gradient: [COLORS.warning, '#F97316'] },
    { icon: 'trophy', label: 'Complétions', value: stats?.total_completions || 0, color: COLORS.primary, gradient: [COLORS.primary, COLORS.accentPink] },
    { icon: 'happy', label: 'Humeur moy.', value: stats?.average_mood_7days ? `${stats.average_mood_7days}/5` : '-', color: COLORS.accentPink, gradient: [COLORS.accentPink, '#F472B6'] },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCardWrapper}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.15)', 'rgba(236, 72, 153, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCard}
          >
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.accentPink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
              <View style={styles.avatarBadge}>
                <Ionicons name="star" size={14} color={COLORS.warning} />
              </View>
            </View>

            {editing ? (
              <View style={styles.editForm}>
                <Text style={styles.inputLabel}>Nom</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Votre nom"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>

                <Text style={styles.inputLabel}>Heure de rappel</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={editTime}
                    onChangeText={setEditTime}
                    placeholder="08:00"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>

                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditing(false);
                      setEditName(profile?.name || '');
                      setEditTime(profile?.notification_time || '');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButtonWrapper}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.accentPink]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveButton}
                    >
                      {saving ? (
                        <ActivityIndicator color={COLORS.text} size="small" />
                      ) : (
                        <Text style={styles.saveButtonText}>Sauvegarder</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.profileName}>{profile?.name}</Text>
                <View style={styles.reminderBadge}>
                  <Ionicons name="notifications" size={16} color={COLORS.accent} />
                  <Text style={styles.profileTime}>
                    Rappel: {profile?.notification_time}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editButtonWrapper}
                  onPress={() => setEditing(true)}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.accentPink]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.editButton}
                  >
                    <Ionicons name="pencil" size={16} color={COLORS.text} />
                    <Text style={styles.editButtonText}>Modifier</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </LinearGradient>
        </View>

        {/* Stats Section */}
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsGrid}>
          {statsData.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <LinearGradient
                colors={stat.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statIconBg}
              >
                <Ionicons name={stat.icon as any} size={22} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Categories Breakdown */}
        {stats?.categories && Object.keys(stats.categories).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Par catégorie</Text>
            <View style={styles.categoriesCard}>
              {Object.entries(stats.categories).map(([category, count]) => {
                const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.productivity;
                return (
                  <View key={category} style={styles.categoryRow}>
                    <View style={styles.categoryLeft}>
                      <LinearGradient
                        colors={config.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.categoryIcon}
                      >
                        <Ionicons
                          name={config.icon as any}
                          size={18}
                          color="#FFFFFF"
                        />
                      </LinearGradient>
                      <Text style={styles.categoryName}>
                        {CATEGORY_LABELS[category] || category}
                      </Text>
                    </View>
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCount}>{count}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* App Info */}
        <View style={styles.appInfoCard}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.accentPink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.appIconBg}
          >
            <Ionicons name="sparkles" size={28} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.appName}>CoachHabits</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>
            Construis des habitudes durables avec l'IA
          </Text>
        </View>

        {/* User Info */}
        {user && (
          <View style={styles.userInfoCard}>
            <View style={styles.userInfoRow}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.userInfoText}>{user.email}</Text>
            </View>
            <View style={styles.userInfoRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.userInfoText}>
                {user.auth_type === 'google' ? 'Connexion Google' : 'Email'}
              </Text>
            </View>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  header: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  profileCardWrapper: {
    marginBottom: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  profileTime: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
  },
  editButtonWrapper: {
    marginTop: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
  },
  editButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  editForm: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
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
  editButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  saveButtonWrapper: {
    flex: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  categoriesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryCountBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  categoryCount: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  appInfoCard: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  appIconBg: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  appVersion: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  appTagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  userInfoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  userInfoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '15',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
});
