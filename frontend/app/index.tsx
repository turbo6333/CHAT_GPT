import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

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
  textMuted: '#52525B',
  accent: '#22D3EE',
  accentPink: '#EC4899',
  success: '#10B981',
  successLight: '#34D399',
  warning: '#FBBF24',
  error: '#EF4444',
  gradient1: '#8B5CF6',
  gradient2: '#EC4899',
  gradient3: '#22D3EE',
};

const MOOD_DATA = [
  { emoji: '😢', label: 'Triste', color: '#EF4444' },
  { emoji: '😕', label: 'Bof', color: '#F97316' },
  { emoji: '😐', label: 'Neutre', color: '#FBBF24' },
  { emoji: '🙂', label: 'Bien', color: '#34D399' },
  { emoji: '😄', label: 'Super', color: '#10B981' },
];

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; gradient: string[] }> = {
  sport: { icon: 'fitness', color: '#EF4444', gradient: ['#EF4444', '#F97316'] },
  study: { icon: 'book', color: '#3B82F6', gradient: ['#3B82F6', '#8B5CF6'] },
  health: { icon: 'heart', color: '#10B981', gradient: ['#10B981', '#22D3EE'] },
  productivity: { icon: 'rocket', color: '#FBBF24', gradient: ['#FBBF24', '#F97316'] },
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
  const [scaleAnims] = useState(() => 
    Array(5).fill(0).map(() => new Animated.Value(1))
  );

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

  const handleMoodPress = (index: number) => {
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    handleMoodSubmit(index + 1);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <Ionicons name="sparkles" size={32} color={COLORS.primary} />
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const progress = todayData?.progress || { completed: 0, total: 0, percentage: 0 };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} !</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <LinearGradient
              colors={[COLORS.gradient1, COLORS.gradient2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerIconGradient}
            >
              <Ionicons name="sunny" size={24} color={COLORS.text} />
            </LinearGradient>
          </View>
        </View>

        {/* Progress Card with Gradient */}
        <View style={styles.progressCardWrapper}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.15)', 'rgba(236, 72, 153, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.progressCard}
          >
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressLabel}>Progression du jour</Text>
                <Text style={styles.progressTitle}>
                  {progress.completed}/{progress.total} habitudes
                </Text>
              </View>
              <View style={styles.progressCircle}>
                <Text style={styles.progressPercent}>{progress.percentage}%</Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <LinearGradient
                colors={[COLORS.gradient1, COLORS.gradient2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBar,
                  { width: `${Math.max(progress.percentage, 2)}%` },
                ]}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Mood Card */}
        <TouchableOpacity
          style={styles.moodCard}
          onPress={() => setShowMoodPicker(!showMoodPicker)}
          activeOpacity={0.9}
        >
          <View style={styles.moodHeader}>
            <View style={styles.moodHeaderLeft}>
              <View style={styles.moodIconContainer}>
                <Ionicons name="heart" size={18} color={COLORS.accentPink} />
              </View>
              <Text style={styles.moodTitle}>Comment te sens-tu ?</Text>
            </View>
            {selectedMood ? (
              <View style={[styles.selectedMoodBadge, { backgroundColor: MOOD_DATA[selectedMood - 1].color + '20' }]}>
                <Text style={styles.selectedMoodEmoji}>
                  {MOOD_DATA[selectedMood - 1].emoji}
                </Text>
                <Text style={[styles.selectedMoodLabel, { color: MOOD_DATA[selectedMood - 1].color }]}>
                  {MOOD_DATA[selectedMood - 1].label}
                </Text>
              </View>
            ) : (
              <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            )}
          </View>
          {showMoodPicker && (
            <View style={styles.moodPicker}>
              {MOOD_DATA.map((mood, index) => (
                <Animated.View
                  key={index}
                  style={{ transform: [{ scale: scaleAnims[index] }] }}
                >
                  <TouchableOpacity
                    style={[
                      styles.moodOption,
                      selectedMood === index + 1 && { backgroundColor: mood.color + '30', borderColor: mood.color },
                    ]}
                    onPress={() => handleMoodPress(index)}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={[styles.moodOptionLabel, selectedMood === index + 1 && { color: mood.color }]}>
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* Habits Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Habitudes du jour</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>
                {todayData?.habits?.length || 0}
              </Text>
            </View>
          </View>
          
          {todayData?.habits && todayData.habits.length > 0 ? (
            todayData.habits.map((habit, index) => {
              const config = CATEGORY_CONFIG[habit.category] || CATEGORY_CONFIG.productivity;
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={[
                    styles.habitCard,
                    habit.completed_today && styles.habitCardCompleted,
                  ]}
                  onPress={() => handleCheckIn(habit.id, habit.completed_today)}
                  activeOpacity={0.8}
                >
                  <View style={styles.habitLeft}>
                    <LinearGradient
                      colors={habit.completed_today ? [COLORS.success, COLORS.successLight] : config.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.habitIcon}
                    >
                      <Ionicons
                        name={habit.completed_today ? 'checkmark' : config.icon as any}
                        size={22}
                        color="#FFFFFF"
                      />
                    </LinearGradient>
                    <View style={styles.habitInfo}>
                      <Text
                        style={[
                          styles.habitName,
                          habit.completed_today && styles.habitNameCompleted,
                        ]}
                      >
                        {habit.name}
                      </Text>
                      <View style={styles.streakContainer}>
                        <Ionicons name="flame" size={14} color={COLORS.warning} />
                        <Text style={styles.habitStreak}>
                          {habit.streak} jour{habit.streak !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      habit.completed_today && styles.checkboxChecked,
                    ]}
                  >
                    {habit.completed_today && (
                      <Ionicons name="checkmark" size={16} color={COLORS.text} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(236, 72, 153, 0.1)']}
                style={styles.emptyIconBg}
              >
                <Ionicons name="leaf" size={40} color={COLORS.primary} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>Aucune habitude</Text>
              <Text style={styles.emptyText}>
                Commence à construire de bonnes habitudes{"\n"}en créant ta première !
              </Text>
            </View>
          )}
        </View>

        {/* Motivational Quote */}
        <View style={styles.quoteCard}>
          <Ionicons name="sparkles" size={20} color={COLORS.accent} />
          <Text style={styles.quoteText}>
            "La discipline est le pont entre les objectifs et la réussite."
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
  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
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
    marginTop: 12,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  headerIcon: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCardWrapper: {
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  progressCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  moodCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  moodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.accentPink + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  moodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  selectedMoodEmoji: {
    fontSize: 18,
  },
  selectedMoodLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  moodPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  moodOption: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 58,
  },
  moodEmoji: {
    fontSize: 26,
  },
  moodOptionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionBadge: {
    backgroundColor: COLORS.primary + '25',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 10,
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  habitCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  habitCardCompleted: {
    backgroundColor: COLORS.success + '10',
    borderColor: COLORS.success + '30',
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  habitNameCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  habitStreak: {
    fontSize: 13,
    color: COLORS.warning,
    fontWeight: '600',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 32,
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 12,
  },
  quoteText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
