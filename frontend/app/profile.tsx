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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const COLORS = {
  primary: '#6C63FF',
  background: '#0F0F1A',
  surface: '#1A1A2E',
  card: '#252542',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
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

  useEffect(() => {
    fetchData();
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

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      sport: 'fitness',
      study: 'book',
      health: 'heart',
      productivity: 'rocket',
    };
    return icons[category] || 'ellipse';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      sport: '#EF4444',
      study: '#3B82F6',
      health: '#10B981',
      productivity: '#F59E0B',
    };
    return colors[category] || COLORS.primary;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      sport: 'Sport',
      study: 'Études',
      health: 'Santé',
      productivity: 'Productivité',
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Votre nom"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Heure de rappel</Text>
              <TextInput
                style={styles.input}
                value={editTime}
                onChangeText={setEditTime}
                placeholder="08:00"
                placeholderTextColor={COLORS.textSecondary}
              />

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
                  style={[
                    styles.saveButton,
                    saving && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={COLORS.text} size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Sauvegarder</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.profileName}>{profile?.name}</Text>
              <Text style={styles.profileTime}>
                Rappel quotidien: {profile?.notification_time}
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
                <Ionicons name="pencil" size={16} color={COLORS.text} />
                <Text style={styles.editButtonText}>Modifier</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Stats Section */}
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
            <Text style={styles.statValue}>{stats?.total_habits || 0}</Text>
            <Text style={styles.statLabel}>Habitudes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={28} color={COLORS.warning} />
            <Text style={styles.statValue}>{stats?.total_streaks || 0}</Text>
            <Text style={styles.statLabel}>Série totale</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={28} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats?.total_completions || 0}</Text>
            <Text style={styles.statLabel}>Complétions</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="happy" size={28} color="#EC4899" />
            <Text style={styles.statValue}>
              {stats?.average_mood_7days || '-'}/5
            </Text>
            <Text style={styles.statLabel}>Humeur moy.</Text>
          </View>
        </View>

        {/* Categories Breakdown */}
        {stats?.categories && Object.keys(stats.categories).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Par catégorie</Text>
            <View style={styles.categoriesCard}>
              {Object.entries(stats.categories).map(([category, count]) => (
                <View key={category} style={styles.categoryRow}>
                  <View style={styles.categoryLeft}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: getCategoryColor(category) + '20' },
                      ]}
                    >
                      <Ionicons
                        name={getCategoryIcon(category) as any}
                        size={18}
                        color={getCategoryColor(category)}
                      />
                    </View>
                    <Text style={styles.categoryName}>
                      {getCategoryLabel(category)}
                    </Text>
                  </View>
                  <Text style={styles.categoryCount}>{count} habitude{count !== 1 ? 's' : ''}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>CoachHabits</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>
            Construis des habitudes durables avec l'IA
          </Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 16,
  },
  editButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  editForm: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  editButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
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
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    width: '47%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  categoriesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  categoryCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  appVersion: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  appTagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
