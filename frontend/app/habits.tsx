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

const CATEGORIES = [
  { id: 'sport', label: 'Sport', icon: 'fitness', color: '#EF4444' },
  { id: 'study', label: 'Études', icon: 'book', color: '#3B82F6' },
  { id: 'health', label: 'Santé', icon: 'heart', color: '#10B981' },
  { id: 'productivity', label: 'Productivité', icon: 'rocket', color: '#F59E0B' },
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
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Habitudes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {habits.length > 0 ? (
          habits.map((habit) => {
            const category = getCategoryInfo(habit.category);
            return (
              <View key={habit.id} style={styles.habitCard}>
                <View style={styles.habitLeft}>
                  <View
                    style={[
                      styles.habitIcon,
                      { backgroundColor: category.color + '20' },
                    ]}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={22}
                      color={category.color}
                    />
                  </View>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    <View style={styles.habitMeta}>
                      <Text style={styles.habitCategory}>{category.label}</Text>
                      <Text style={styles.habitStreak}>
                        🔥 {habit.streak} jour{habit.streak !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteHabit(habit.id, habit.name)}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune habitude</Text>
            <Text style={styles.emptyText}>
              Commence à construire de bonnes habitudes{' '}\nen créant ta première !
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={20} color={COLORS.text} />
              <Text style={styles.emptyButtonText}>Créer une habitude</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create Habit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle habitude</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nom de l'habitude</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Méditation matinale"
              placeholderTextColor={COLORS.textSecondary}
              value={newHabitName}
              onChangeText={setNewHabitName}
            />

            <Text style={styles.inputLabel}>Catégorie</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    selectedCategory === category.id && styles.categorySelected,
                    { borderColor: category.color },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={20}
                    color={selectedCategory === category.id ? COLORS.text : category.color}
                  />
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
            <TextInput
              style={styles.input}
              placeholder="Ex: 08:00"
              placeholderTextColor={COLORS.textSecondary}
              value={reminderTime}
              onChangeText={setReminderTime}
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!newHabitName.trim() || saving) && styles.saveButtonDisabled,
              ]}
              onPress={handleCreateHabit}
              disabled={!newHabitName.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={COLORS.text} />
                  <Text style={styles.saveButtonText}>Créer l'habitude</Text>
                </>
              )}
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
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
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
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  habitCategory: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: 12,
  },
  habitStreak: {
    fontSize: 13,
    color: COLORS.warning,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: COLORS.card,
  },
  categorySelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  categoryLabelSelected: {
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
