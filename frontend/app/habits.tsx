import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

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

const CATEGORIES = [
  { id: 'sport', label: 'Sport', icon: 'fitness', color: '#EF4444', gradient: ['#EF4444', '#F97316'] },
  { id: 'study', label: 'Études', icon: 'book', color: '#3B82F6', gradient: ['#3B82F6', '#8B5CF6'] },
  { id: 'health', label: 'Santé', icon: 'heart', color: '#10B981', gradient: ['#10B981', '#22D3EE'] },
  { id: 'productivity', label: 'Productivité', icon: 'rocket', color: '#FBBF24', gradient: ['#FBBF24', '#F97316'] },
];

interface Habit {
  id: string;
  name: string;
  category: string;
  reminder_time: string | null;
  streak: number;
  created_at: string;
}

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('sport');
  const [reminderTime, setReminderTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const fetchHabits = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/habits`);
      setHabits(response.data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fetchHabits]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHabits();
  }, [fetchHabits]);

  const handleCreateHabit = async () => {
    if (!newHabitName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour l\'habitude');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${BACKEND_URL}/api/habits`, {
        name: newHabitName.trim(),
        category: selectedCategory,
        reminder_time: reminderTime || null,
      });
      setNewHabitName('');
      setSelectedCategory('sport');
      setReminderTime('');
      setModalVisible(false);
      fetchHabits();
    } catch (error) {
      console.error('Error creating habit:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'habitude');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHabit = async (habitId: string, habitName: string) => {
    Alert.alert(
      'Supprimer l\'habitude',
      `Voulez-vous vraiment supprimer "${habitName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/habits/${habitId}`);
              fetchHabits();
            } catch (error) {
              console.error('Error deleting habit:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'habitude');
            }
          },
        },
      ]
    );
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <Ionicons name="checkmark-circle" size={32} color={COLORS.primary} />
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mes Habitudes</Text>
          <Text style={styles.subtitle}>{habits.length} habitude{habits.length !== 1 ? 's' : ''} actives</Text>
        </View>
        <TouchableOpacity
          style={styles.addButtonWrapper}
          onPress={() => setModalVisible(true)}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.accentPink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButton}
          >
            <Ionicons name="add" size={26} color={COLORS.text} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {habits.length > 0 ? (
          habits.map((habit, index) => {
            const category = getCategoryInfo(habit.category);
            return (
              <Animated.View
                key={habit.id}
                style={[
                  styles.habitCard,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20 * (index + 1), 0],
                      }),
                    }],
                  },
                ]}
              >
                <View style={styles.habitLeft}>
                  <LinearGradient
                    colors={category.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.habitIcon}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={24}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    <View style={styles.habitMeta}>
                      <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
                        <Text style={[styles.categoryBadgeText, { color: category.color }]}>
                          {category.label}
                        </Text>
                      </View>
                      <View style={styles.streakBadge}>
                        <Ionicons name="flame" size={12} color={COLORS.warning} />
                        <Text style={styles.habitStreak}>
                          {habit.streak}j
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteHabit(habit.id, habit.name)}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </Animated.View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.2)', 'rgba(236, 72, 153, 0.1)']}
              style={styles.emptyIconBg}
            >
              <Ionicons name="leaf" size={48} color={COLORS.primary} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Aucune habitude</Text>
            <Text style={styles.emptyText}>
              Commence à construire de bonnes habitudes{"\n"}en créant ta première !
            </Text>
            <TouchableOpacity
              style={styles.emptyButtonWrapper}
              onPress={() => setModalVisible(true)}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.accentPink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyButton}
              >
                <Ionicons name="add" size={20} color={COLORS.text} />
                <Text style={styles.emptyButtonText}>Créer une habitude</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>

      {/* Create Habit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Handle */}
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle habitude</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nom de l'habitude</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Méditation matinale"
                placeholderTextColor={COLORS.textSecondary}
                value={newHabitName}
                onChangeText={setNewHabitName}
              />
            </View>

            <Text style={styles.inputLabel}>Catégorie</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    selectedCategory === category.id && styles.categorySelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <LinearGradient
                    colors={selectedCategory === category.id ? category.gradient : [COLORS.card, COLORS.card]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.categoryIconBg}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={18}
                      color={selectedCategory === category.id ? '#FFFFFF' : category.color}
                    />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.categoryLabel,
                      selectedCategory === category.id && styles.categoryLabelSelected,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Rappel (optionnel)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: 08:00"
                placeholderTextColor={COLORS.textSecondary}
                value={reminderTime}
                onChangeText={setReminderTime}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButtonWrapper,
                (!newHabitName.trim() || saving) && styles.saveButtonDisabled,
              ]}
              onPress={handleCreateHabit}
              disabled={!newHabitName.trim() || saving}
            >
              <LinearGradient
                colors={newHabitName.trim() && !saving ? [COLORS.primary, COLORS.accentPink] : [COLORS.card, COLORS.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.text} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={22} color={COLORS.text} />
                    <Text style={styles.saveButtonText}>Créer l'habitude</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  addButtonWrapper: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  habitCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitIcon: {
    width: 54,
    height: 54,
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
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  habitStreak: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '600',
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    marginTop: 40,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  emptyButtonWrapper: {
    marginTop: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  emptyButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
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
    marginBottom: 20,
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 10,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
  },
  categorySelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  categoryIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 10,
    fontWeight: '500',
  },
  categoryLabelSelected: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  saveButtonWrapper: {
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  saveButtonText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '600',
  },
});
