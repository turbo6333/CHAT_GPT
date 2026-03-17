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
  TextInput,
  Keyboard,
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
  userBubble: '#3B3B5C',
};

const QUICK_PROMPTS = [
  { icon: 'sad-outline', text: 'Je ne me sens pas bien', color: '#EF4444' },
  { icon: 'bulb-outline', text: 'Conseils motivation', color: '#FBBF24' },
  { icon: 'fitness-outline', text: 'Aide pour mes habitudes', color: '#10B981' },
  { icon: 'moon-outline', text: 'Problèmes de sommeil', color: '#8B5CF6' },
];

interface CoachMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export default function CoachScreen() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userName, setUserName] = useState('Utilisateur');
  const [inputText, setInputText] = useState('');
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const inputRef = useRef<TextInput>(null);

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
    if (sending) {
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
  }, [sending]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/coach/messages`);
      setMessages(response.data);
      if (response.data.length > 0) {
        setShowQuickPrompts(false);
      }
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

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    
    const messageText = text.trim();
    setInputText('');
    setSending(true);
    setShowQuickPrompts(false);
    Keyboard.dismiss();

    // Optimistically add user message
    const tempUserMsg: CoachMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/coach/chat`, {
        message: messageText,
        user_name: userName,
      });

      // Add assistant response
      const assistantMsg: CoachMessage = {
        id: response.data.assistant_message_id,
        role: 'assistant',
        content: response.data.response,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => {
        // Replace temp user message with real one and add assistant response
        const filtered = prev.filter(m => m.id !== tempUserMsg.id);
        return [...filtered, { ...tempUserMsg, id: response.data.user_message_id }, assistantMsg];
      });

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const clearHistory = async () => {
    try {
      await axios.delete(`${BACKEND_URL}/api/coach/messages`);
      setMessages([]);
      setShowQuickPrompts(true);
    } catch (error) {
      console.error('Error clearing history:', error);
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
                <Text style={styles.coachSubtitle}>Toujours là pour toi</Text>
              </View>
            </View>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
              <Ionicons name="trash-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && showQuickPrompts ? (
            <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(236, 72, 153, 0.1)']}
                style={styles.emptyIconBg}
              >
                <Ionicons name="chatbubbles" size={48} color={COLORS.primary} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>Salut {userName} ! 👋</Text>
              <Text style={styles.emptyText}>
                Je suis ton coach personnel. Tu peux me parler{"\n"}de tout ce qui te préoccupe ou me demander{"\n"}des conseils pour tes habitudes.
              </Text>

              {/* Quick Prompts */}
              <View style={styles.quickPromptsContainer}>
                <Text style={styles.quickPromptsTitle}>Suggestions pour commencer :</Text>
                {QUICK_PROMPTS.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickPromptButton}
                    onPress={() => handleQuickPrompt(prompt.text)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.quickPromptIcon, { backgroundColor: prompt.color + '20' }]}>
                      <Ionicons name={prompt.icon as any} size={20} color={prompt.color} />
                    </View>
                    <Text style={styles.quickPromptText}>{prompt.text}</Text>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          ) : (
            <>
              {messages.map((message, index) => {
                const showDate =
                  index === 0 ||
                  formatDate(message.created_at) !==
                    formatDate(messages[index - 1].created_at);
                const isUser = message.role === 'user';

                return (
                  <Animated.View key={message.id} style={{ opacity: fadeAnim }}>
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
                    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
                      {!isUser && (
                        <LinearGradient
                          colors={[COLORS.primary + '30', COLORS.accentPink + '20']}
                          style={styles.messageAvatar}
                        >
                          <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                        </LinearGradient>
                      )}
                      <View style={[
                        styles.messageBubble,
                        isUser ? styles.userBubble : styles.assistantBubble
                      ]}>
                        <Text style={styles.messageText}>{message.content}</Text>
                        <Text style={[styles.messageTime, isUser && styles.messageTimeUser]}>
                          {formatTime(message.created_at)}
                        </Text>
                      </View>
                      {isUser && (
                        <View style={styles.userAvatar}>
                          <Text style={styles.userAvatarText}>
                            {userName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Animated.View>
                );
              })}

              {sending && (
                <View style={styles.messageRow}>
                  <Animated.View style={[{ transform: [{ scale: pulseAnim }] }]}>
                    <LinearGradient
                      colors={[COLORS.primary + '30', COLORS.accentPink + '20']}
                      style={styles.messageAvatar}
                    >
                      <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                    </LinearGradient>
                  </Animated.View>
                  <View style={[styles.messageBubble, styles.assistantBubble]}>
                    <View style={styles.typingIndicator}>
                      <View style={[styles.typingDot, styles.typingDot1]} />
                      <View style={[styles.typingDot, styles.typingDot2]} />
                      <View style={[styles.typingDot, styles.typingDot3]} />
                    </View>
                    <Text style={styles.generatingText}>En train de réfléchir...</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Écris ton message..."
              placeholderTextColor={COLORS.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || sending}
            >
              <LinearGradient
                colors={inputText.trim() && !sending ? [COLORS.primary, COLORS.accentPink] : [COLORS.card, COLORS.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButtonGradient}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={COLORS.textSecondary} />
                ) : (
                  <Ionicons name="send" size={18} color={inputText.trim() ? COLORS.text : COLORS.textSecondary} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
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
    paddingTop: 20,
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
  },
  quickPromptsContainer: {
    width: '100%',
    marginTop: 32,
  },
  quickPromptsTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quickPromptIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickPromptText: {
    flex: 1,
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
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  messageBubble: {
    borderRadius: 18,
    padding: 14,
    maxWidth: '75%',
  },
  assistantBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 6,
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
  messageTimeUser: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
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
    marginTop: 6,
    fontStyle: 'italic',
  },
  inputContainer: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    backgroundColor: COLORS.background,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    maxHeight: 100,
    paddingVertical: 8,
    paddingRight: 8,
  },
  sendButton: {
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
