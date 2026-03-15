import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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

  useEffect(() => {
    fetchMessages();
    fetchProfile();
  }, []);

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
      
      // Add the new message to the list
      const newMessage: CoachMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.data.insight,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMessage]);
      
      // Scroll to bottom
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
        <ActivityIndicator size="large" color={COLORS.primary} />
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
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.coachAvatar}>
              <Ionicons name="sparkles" size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.coachName}>Coach IA</Text>
              <Text style={styles.coachSubtitle}>Psychologie des habitudes</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>Bienvenue !</Text>
              <Text style={styles.emptyText}>
                Je suis ton coach personnel basé sur les principes de la TCC.{' '}\nDemande-moi un insight pour recevoir des conseils personnalisés.
              </Text>
            </View>
          ) : (
            messages.map((message, index) => {
              const showDate =
                index === 0 ||
                formatDate(message.created_at) !==
                  formatDate(messages[index - 1].created_at);

              return (
                <View key={message.id}>
                  {showDate && (
                    <View style={styles.dateHeader}>
                      <Text style={styles.dateText}>
                        {formatDate(message.created_at)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.messageRow}>
                    <View style={styles.messageAvatar}>
                      <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                    </View>
                    <View style={styles.messageBubble}>
                      <Text style={styles.messageText}>{message.content}</Text>
                      <Text style={styles.messageTime}>
                        {formatTime(message.created_at)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {generating && (
            <View style={styles.messageRow}>
              <View style={styles.messageAvatar}>
                <Ionicons name="sparkles" size={16} color={COLORS.primary} />
              </View>
              <View style={styles.messageBubble}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Context Card */}
        {lastContext && (
          <View style={styles.contextCard}>
            <View style={styles.contextItem}>
              <Text style={styles.contextValue}>
                {lastContext.habits_completed}/{lastContext.habits_total}
              </Text>
              <Text style={styles.contextLabel}>Habitudes</Text>
            </View>
            <View style={styles.contextDivider} />
            <View style={styles.contextItem}>
              <Text style={styles.contextValue}>{lastContext.mood}/5</Text>
              <Text style={styles.contextLabel}>Humeur</Text>
            </View>
            <View style={styles.contextDivider} />
            <View style={styles.contextItem}>
              <Text style={styles.contextValue}>
                {lastContext.average_streak}j
              </Text>
              <Text style={styles.contextLabel}>Série moy.</Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[
              styles.insightButton,
              generating && styles.insightButtonDisabled,
            ]}
            onPress={requestInsight}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color={COLORS.text} />
                <Text style={styles.insightButtonText}>
                  Demander un insight
                </Text>
              </>
            )}
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coachName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  coachSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageBubble: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 14,
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginHorizontal: 2,
    opacity: 0.4,
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
  contextCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  contextItem: {
    flex: 1,
    alignItems: 'center',
  },
  contextValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  contextLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  contextDivider: {
    width: 1,
    backgroundColor: COLORS.card,
  },
  inputContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  insightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  insightButtonDisabled: {
    opacity: 0.6,
  },
  insightButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
