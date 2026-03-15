import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
};

interface CoachMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface InsightContext {
  habits_completed: number;
  habits_total: number;
  mood: number | string;
  average_streak: number;
}

export default function CoachScreen() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userName, setUserName] = useState('Utilisateur');
  const [lastContext, setLastContext] = useState<InsightContext | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    fetchMessages();
    fetchProfile();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (generating) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [generating]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/coach/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/profile`);
      setUserName(response.data.name);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const requestInsight = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/coach/insight`, {
        user_name: userName,
      });
      
      setLastContext(response.data.context);
      
      const newMessage: CoachMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.data.insight,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMessage]);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error getting insight:', error);
    } finally {
      setGenerating(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.primary + '30', COLORS.accentPink + '20']}
          style={styles.loadingIconBg}
        >
          <Ionicons name="sparkles" size={32} color={COLORS.primary} />
        </LinearGradient>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.accentPink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.coachAvatar}
            >
              <Ionicons name="sparkles" size={28} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <Text style={styles.coachName}>Coach IA</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.coachSubtitle}>Psychologie des habitudes</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(236, 72, 153, 0.1)']}
                style={styles.emptyIconBg}
              >
                <Ionicons name="chatbubbles" size={48} color={COLORS.primary} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>Bienvenue !</Text>
              <Text style={styles.emptyText}>
                Je suis ton coach personnel basé sur les principes de la TCC.{"\n"}Demande-moi un insight pour recevoir des conseils personnalisés.
              </Text>

              {/* Features List */}
              <View style={styles.featuresList}>
                {[
                  { icon: 'analytics', text: 'Analyse de tes habitudes' },
                  { icon: 'bulb', text: 'Conseils personnalisés TCC' },
                  { icon: 'trending-up', text: 'Suivi de ta progression' },
                ].map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Ionicons name={feature.icon as any} size={18} color={COLORS.primary} />
                    </View>
                    <Text style={styles.featureText}>{feature.text}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          ) : (
            messages.map((message, index) => {
              const showDate =
                index === 0 ||
                formatDate(message.created_at) !==
                  formatDate(messages[index - 1].created_at);

              return (
                <Animated.View 
                  key={message.id}
                  style={{ opacity: fadeAnim }}
                >
                  {showDate && (
                    <View style={styles.dateHeader}>
                      <LinearGradient
                        colors={[COLORS.surface, COLORS.card]}
                        style={styles.dateBadge}
                      >
                        <Text style={styles.dateText}>
                          {formatDate(message.created_at)}
                        </Text>
                      </LinearGradient>
                    </View>
                  )}
                  <View style={styles.messageRow}>
                    <LinearGradient
                      colors={[COLORS.primary + '30', COLORS.accentPink + '20']}
                      style={styles.messageAvatar}
                    >
                      <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                    </LinearGradient>
                    <View style={styles.messageBubble}>
                      <Text style={styles.messageText}>{message.content}</Text>
                      <Text style={styles.messageTime}>
                        {formatTime(message.created_at)}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })
          )}

          {generating && (
            <View style={styles.messageRow}>
              <Animated.View style={[{ transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient
                  colors={[COLORS.primary + '30', COLORS.accentPink + '20']}
                  style={styles.messageAvatar}
                >
                  <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                </LinearGradient>
              </Animated.View>
              <View style={styles.messageBubble}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
                <Text style={styles.generatingText}>Génération en cours...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Context Card */}
        {lastContext && (
          <View style={styles.contextCard}>
            <View style={styles.contextItem}>
              <View style={[styles.contextIconBg, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              </View>
              <Text style={styles.contextValue}>
                {lastContext.habits_completed}/{lastContext.habits_total}
              </Text>
              <Text style={styles.contextLabel}>Habitudes</Text>
            </View>
            <View style={styles.contextDivider} />
            <View style={styles.contextItem}>
              <View style={[styles.contextIconBg, { backgroundColor: COLORS.accentPink + '20' }]}>
                <Ionicons name="heart" size={18} color={COLORS.accentPink} />
              </View>
              <Text style={styles.contextValue}>{lastContext.mood}/5</Text>
              <Text style={styles.contextLabel}>Humeur</Text>
            </View>
            <View style={styles.contextDivider} />
            <View style={styles.contextItem}>
              <View style={[styles.contextIconBg, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="flame" size={18} color={COLORS.warning} />
              </View>
              <Text style={styles.contextValue}>
                {lastContext.average_streak}j
              </Text>
              <Text style={styles.contextLabel}>Série</Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[
              styles.insightButtonWrapper,
              generating && styles.insightButtonDisabled,
            ]}
            onPress={requestInsight}
            disabled={generating}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={generating ? [COLORS.card, COLORS.card] : [COLORS.primary, COLORS.accentPink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.insightButton}
            >
              {generating ? (
                <ActivityIndicator color={COLORS.textSecondary} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={22} color={COLORS.text} />
                  <Text style={styles.insightButtonText}>
                    Demander un insight
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachAvatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  coachName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  coachSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresList: {
    marginTop: 32,
    width: '100%',
    paddingHorizontal: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dateBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  messageBubble: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    padding: 16,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginHorizontal: 3,
  },
  typingDot1: {
    opacity: 1,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 0.4,
  },
  generatingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  contextCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  contextItem: {
    flex: 1,
    alignItems: 'center',
  },
  contextIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  contextValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  contextLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  contextDivider: {
    width: 1,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 8,
  },
  inputContainer: {
    padding: 20,
    paddingTop: 8,
  },
  insightButtonWrapper: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  insightButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  insightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    gap: 10,
  },
  insightButtonText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '600',
  },
});
