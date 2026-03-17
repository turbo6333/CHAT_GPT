import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
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
  accent: '#22D3EE',
  accentPink: '#EC4899',
  success: '#10B981',
  warning: '#FBBF24',
  error: '#EF4444',
};

const DAY_NAMES: Record<string, string> = {
  'Mon': 'Lun',
  'Tue': 'Mar',
  'Wed': 'Mer',
  'Thu': 'Jeu',
  'Fri': 'Ven',
  'Sat': 'Sam',
  'Sun': 'Dim',
};

interface ChartsData {
  weekly_completion: Array<{
    date: string;
    day: string;
    completed: number;
    total: number;
  }>;
  mood_evolution: Array<{
    date: string;
    mood: number | null;
  }>;
  categories: Array<{
    name: string;
    count: number;
    color: string;
  }>;
  streak_leaders: Array<{
    name: string;
    streak: number;
    category: string;
  }>;
}

export default function StatsScreen() {
  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/stats/charts`);
      setChartsData(response.data);
    } catch (error) {
      console.error('Error fetching charts data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.primary + '30', COLORS.accentPink + '20']}
          style={styles.loadingIconBg}
        >
          <Ionicons name="bar-chart" size={32} color={COLORS.primary} />
        </LinearGradient>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Prepare bar chart data
  const barData = chartsData?.weekly_completion.map((item, index) => ({
    value: item.total > 0 ? (item.completed / item.total) * 100 : 0,
    label: DAY_NAMES[item.day] || item.day,
    frontColor: index === chartsData.weekly_completion.length - 1 ? COLORS.primary : COLORS.primaryLight,
    topLabelComponent: () => (
      <Text style={styles.barTopLabel}>{item.completed}</Text>
    ),
  })) || [];

  // Prepare line chart data (mood)
  const moodData = chartsData?.mood_evolution
    .filter(item => item.mood !== null)
    .map(item => ({
      value: item.mood || 0,
      dataPointText: item.mood?.toString(),
    })) || [];

  // Prepare pie chart data
  const pieData = chartsData?.categories.map(item => ({
    value: item.count,
    color: item.color,
    text: item.count.toString(),
    textColor: COLORS.text,
    textSize: 12,
  })) || [];

  const getCategoryLabel = (name: string) => {
    const labels: Record<string, string> = {
      sport: 'Sport',
      study: 'Études',
      health: 'Santé',
      productivity: 'Productivité',
    };
    return labels[name] || name;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Statistiques</Text>
          <Text style={styles.subtitle}>Tes performances en un coup d'œil</Text>
        </View>

        {/* Weekly Progress */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <View style={[styles.chartIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="calendar" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.chartTitle}>Progression hebdomadaire</Text>
            </View>
            <Text style={styles.chartSubtitle}>% d'habitudes complétées</Text>
          </View>
          <View style={styles.chartContainer}>
            {barData.length > 0 ? (
              <BarChart
                data={barData}
                width={width - 100}
                height={160}
                barWidth={28}
                spacing={16}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: COLORS.textSecondary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: COLORS.textSecondary, fontSize: 11 }}
                noOfSections={4}
                maxValue={100}
                isAnimated
                animationDuration={500}
              />
            ) : (
              <Text style={styles.noDataText}>Pas assez de données</Text>
            )}
          </View>
        </View>

        {/* Mood Evolution */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <View style={[styles.chartIcon, { backgroundColor: COLORS.accentPink + '20' }]}>
                <Ionicons name="heart" size={18} color={COLORS.accentPink} />
              </View>
              <Text style={styles.chartTitle}>Évolution de l'humeur</Text>
            </View>
            <Text style={styles.chartSubtitle}>14 derniers jours</Text>
          </View>
          <View style={styles.chartContainer}>
            {moodData.length > 2 ? (
              <LineChart
                data={moodData}
                width={width - 100}
                height={160}
                color={COLORS.accentPink}
                thickness={3}
                hideRules
                hideYAxisText
                xAxisThickness={0}
                yAxisThickness={0}
                curved
                areaChart
                startFillColor={COLORS.accentPink}
                startOpacity={0.3}
                endOpacity={0.05}
                dataPointsColor={COLORS.accentPink}
                dataPointsRadius={5}
                maxValue={5}
                noOfSections={5}
                isAnimated
                animationDuration={800}
              />
            ) : (
              <Text style={styles.noDataText}>Enregistre ton humeur pour voir l'évolution</Text>
            )}
          </View>
        </View>

        {/* Categories Breakdown */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <View style={[styles.chartIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="pie-chart" size={18} color={COLORS.success} />
              </View>
              <Text style={styles.chartTitle}>Répartition par catégorie</Text>
            </View>
          </View>
          <View style={styles.pieContainer}>
            {pieData.length > 0 ? (
              <>
                <PieChart
                  data={pieData}
                  radius={70}
                  innerRadius={45}
                  innerCircleColor={COLORS.surface}
                  centerLabelComponent={() => (
                    <View style={styles.pieCenter}>
                      <Text style={styles.pieCenterValue}>
                        {pieData.reduce((a, b) => a + b.value, 0)}
                      </Text>
                      <Text style={styles.pieCenterLabel}>habitudes</Text>
                    </View>
                  )}
                />
                <View style={styles.legendContainer}>
                  {chartsData?.categories.map((cat, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.legendText}>{getCategoryLabel(cat.name)}</Text>
                      <Text style={styles.legendValue}>{cat.count}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.noDataText}>Crée des habitudes pour voir la répartition</Text>
            )}
          </View>
        </View>

        {/* Streak Leaders */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <View style={[styles.chartIcon, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="flame" size={18} color={COLORS.warning} />
              </View>
              <Text style={styles.chartTitle}>Meilleures séries</Text>
            </View>
          </View>
          {chartsData?.streak_leaders && chartsData.streak_leaders.length > 0 ? (
            <View style={styles.streakList}>
              {chartsData.streak_leaders.map((item, index) => (
                <View key={index} style={styles.streakItem}>
                  <View style={styles.streakRank}>
                    <Text style={styles.streakRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.streakInfo}>
                    <Text style={styles.streakName}>{item.name}</Text>
                    <Text style={styles.streakCategory}>{getCategoryLabel(item.category)}</Text>
                  </View>
                  <View style={styles.streakBadge}>
                    <Ionicons name="flame" size={14} color={COLORS.warning} />
                    <Text style={styles.streakValue}>{item.streak}j</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>Complète des habitudes pour voir tes séries</Text>
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
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chartIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  chartSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: 46,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  barTopLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  noDataText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 30,
  },
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  pieCenter: {
    alignItems: 'center',
  },
  pieCenterValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  pieCenterLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  legendContainer: {
    flex: 1,
    marginLeft: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  streakList: {
    gap: 10,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
  },
  streakRank: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  streakRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  streakInfo: {
    flex: 1,
  },
  streakName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  streakCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  streakValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.warning,
  },
});
