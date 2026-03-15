import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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

const MOOD_EMOJIS = ['😢', '😕', '😐', '🙂', '😄'];
const CATEGORY_ICONS: Record<string, string> = {
  sport: 'fitness',
  study: 'book',
  health: 'heart',
  productivity: 'rocket',
};

interface Habit {
  id: string;
  name: string;
  category: string;
  streak: number;
  completed_today: boolean;
}

interface TodayData {
  date: string;
  habits: Habit[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  mood: { mood: number } | null;
}

export default function Dashboard() {
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  const fetchTodayData = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/today`);
      setTodayData(response.data);
      if (response.data.mood) {
        setSelectedMood(response.data.mood.mood);
      }
    } catch (error) {
      console.error('Error fetching today data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayData();
  }, [fetchTodayData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTodayData();
  }, [fetchTodayData]);

  const handleCheckIn = async (habitId: string, currentStatus: boolean) => {
    try {
      await axios.post(`${BACKEND_URL}/api/habits/${habitId}/checkin`, {
        done: !currentStatus,
      });
      fetchTodayData();
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  const handleMoodSubmit = async (mood: number) => {
    try {
      await axios.post(`${BACKEND_URL}/api/moods`, { mood });
      setSelectedMood(mood);
      setShowMoodPicker(false);
      fetchTodayData();
    } catch (error) {
      console.error('Error submitting mood:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const progress = todayData?.progress || { completed: 0, total: 0, percentage: 0 };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour ! 👋</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>

        {/* Mood Card */}
        <TouchableOpacity
          style={styles.moodCard}
          onPress={() => setShowMoodPicker(!showMoodPicker)}
          activeOpacity={0.8}
        >
          <View style={styles.moodHeader}>
            <Text style={styles.moodTitle}>Comment te sens-tu ?</Text>
            {selectedMood && (
              <Text style={styles.selectedMoodEmoji}>
                {MOOD_EMOJIS[selectedMood - 1]}
              </Text>
            )}
          </View>
          {showMoodPicker && (
            <View style={styles.moodPicker}>
              {MOOD_EMOJIS.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.moodOption,
                    selectedMood === index + 1 && styles.moodOptionSelected,
                  ]}
                  onPress={() => handleMoodSubmit(index + 1)}
                >
                  <Text style={styles.moodEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progression du jour</Text>
            <Text style={styles.progressPercent}>{progress.percentage}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress.percentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressSubtext}>
            {progress.completed}/{progress.total} habitudes complétées
          </Text>
        </View>

        {/* Habits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habitudes du jour</Text>
          {todayData?.habits && todayData.habits.length > 0 ? (
            todayData.habits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={styles.habitCard}
                onPress={() => handleCheckIn(habit.id, habit.completed_today)}
                activeOpacity={0.7}
              >
                <View style={styles.habitLeft}>
                  <View
                    style={[
                      styles.habitIcon,
                      habit.completed_today && styles.habitIconCompleted,
                    ]}
                  >
                    <Ionicons
                      name={CATEGORY_ICONS[habit.category] as any || 'ellipse'}
                      size={20}
                      color={habit.completed_today ? COLORS.text : COLORS.primary}
                    />
                  </View>
                  <View style={styles.habitInfo}>
                    <Text
                      style={[
                        styles.habitName,
                        habit.completed_today && styles.habitNameCompleted,
                      ]}
                    >
                      {habit.name}
                    </Text>
                    <Text style={styles.habitStreak}>
                      🔥 {habit.streak} jour{habit.streak !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    habit.completed_today && styles.checkboxChecked,
                  ]}
                >
                  {habit.completed_today && (
                    <Ionicons name="checkmark" size={18} color={COLORS.text} />
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="add-circle-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>Aucune habitude</Text>
              <Text style={styles.emptySubtext}>
                Ajoute ta première habitude dans l'onglet "Habitudes"
              </Text>
            </View>
          )}
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
    marginTop: 16,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  date: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  moodCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  moodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedMoodEmoji: {
    fontSize: 28,
  },
  moodPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.card,
  },
  moodOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  moodEmoji: {
    fontSize: 24,
  },
  progressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.card,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  habitCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  habitIconCompleted: {
    backgroundColor: COLORS.success,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  habitNameCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  habitStreak: {
    fontSize: 13,
    color: COLORS.warning,
    marginTop: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
