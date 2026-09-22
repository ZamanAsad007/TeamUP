import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { AppHeader } from '../../components/AppHeader';
import { Badge } from '../../components/Badge';
import { StateWrapper, ScreenState } from '../../components/StateWrapper';
import { socketService, ChatMessage, SocketConnectionStatus } from '../../services/socketService';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

export interface ChatScreenProps {
  route?: {
    params?: {
      projectId: string;
      projectTitle?: string;
    };
  };
  navigation?: any;
}

interface DisplayMessage extends ChatMessage {
  isPending?: boolean;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const projectId = route?.params?.projectId || '';
  const projectTitle = route?.params?.projectTitle || 'Team Chat';

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [connectionStatus, setConnectionStatus] = useState<SocketConnectionStatus>('disconnected');

  const flatListRef = useRef<FlatList>(null);

  // Initialize socket connection & message history
  const initChat = useCallback(() => {
    if (!projectId) return;

    chatService
      .getProjectMessages(projectId)
      .then((history) => {
        setMessages(history || []);
        setScreenState(history && history.length > 0 ? 'populated' : 'empty');
        setErrorMessage(undefined);
      })
      .catch((err: any) => {
        console.warn('Initial REST message fetch failed, connecting to WS:', err.message);
      });

    socketService
      .connect()
      .then(() => {
        socketService.joinRoom(projectId);
      })
      .catch((err) => {
        console.warn('Socket connect failed:', err);
      });
  }, [projectId]);

  useEffect(() => {
    initChat();

    const unsubStatus = socketService.onStatusChange((status) => {
      setConnectionStatus(status);
      if (status === 'connected') {
        socketService.joinRoom(projectId);
      }
    });

    const unsubNewMessage = socketService.onNewMessage((newMsg) => {
      if (newMsg.projectId !== projectId) return;

      setMessages((prev) => {
        const pendingIndex = prev.findIndex(
          (m) => m.isPending && m.content === newMsg.content && m.senderId === newMsg.senderId
        );

        if (pendingIndex !== -1) {
          const updated = [...prev];
          updated[pendingIndex] = newMsg;
          return updated;
        }

        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }

        return [...prev, newMsg];
      });

      setScreenState('populated');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const unsubHistory = socketService.onMessageHistory((history) => {
      if (Array.isArray(history)) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const toAdd = history.filter((m) => !existingIds.has(m.id));
          const merged = [...prev, ...toAdd].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return merged;
        });
        setScreenState('populated');
      }
    });

    return () => {
      unsubStatus();
      unsubNewMessage();
      unsubHistory();
      socketService.leaveRoom(projectId);
    };
  }, [projectId, initChat]);

  const handleSendMessage = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // ignore
      }
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage: DisplayMessage = {
      id: tempId,
      projectId,
      senderId: user?.id || 'me',
      content: trimmed,
      createdAt: new Date().toISOString(),
      isPending: true,
      sender: {
        id: user?.id || 'me',
        email: user?.email || '',
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setScreenState('populated');
    setInputText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    socketService.sendMessage(projectId, trimmed, (response) => {
      if (response && response.success && response.message) {
        const confirmedMsg = response.message;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...confirmedMsg, isPending: false } : m))
        );
      }
    });
  };

  const handleAttachment = () => {
    Alert.alert('Share with Team', 'Select an attachment type:', [
      { text: 'Image', onPress: () => {} },
      { text: 'Document', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderMessageItem = ({ item }: { item: DisplayMessage }) => {
    const isOwn = item.senderId === user?.id || item.senderId === 'me';
    const senderName = item.sender?.profile?.fullName || item.sender?.email || (isOwn ? 'You' : 'Teammate');
    const timeFormatted = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View
        style={[
          styles.messageRow,
          isOwn ? styles.messageRowOwn : styles.messageRowOther,
          { marginBottom: spacing.md },
        ]}
      >
        {!isOwn && (
          <View
            style={[
              styles.avatarMini,
              { backgroundColor: colors.secondarySoft, borderColor: colors.secondary },
            ]}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.secondary }}>
              {senderName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={{ maxWidth: '78%' }}>
          {!isOwn && (
            <Text
              style={[
                typography.label,
                { color: colors.textMuted, marginBottom: 2, marginLeft: 2 },
              ]}
            >
              {senderName}
            </Text>
          )}

          <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: isOwn ? colors.primary : colors.surfaceMuted,
                borderRadius: borderRadius.md,
                borderColor: isOwn ? colors.primary : colors.border,
                padding: spacing.md,
              },
              isOwn ? styles.bubbleOwn : styles.bubbleOther,
            ]}
          >
            <Text
              style={[
                typography.body,
                { color: isOwn ? '#FFFFFF' : colors.text },
              ]}
            >
              {item.content}
            </Text>

            <View style={styles.messageMetaRow}>
              <Text
                style={[
                  typography.bodySmall,
                  {
                    fontSize: 10,
                    color: isOwn ? 'rgba(255,255,255,0.75)' : colors.textMuted,
                    marginTop: 4,
                  },
                ]}
              >
                {timeFormatted} {item.isPending ? '• Sending...' : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <AppHeader
        title={projectTitle}
        subtitle="Team Chat"
        showBack={Boolean(navigation?.canGoBack && navigation.canGoBack())}
        onBack={() => navigation?.goBack?.()}
        actions={[
          {
            icon: (
              <Badge
                label={
                  connectionStatus === 'connected'
                    ? 'Online'
                    : connectionStatus === 'connecting'
                    ? 'Connecting...'
                    : connectionStatus === 'reconnecting'
                    ? 'Reconnecting...'
                    : 'Offline'
                }
                variant={connectionStatus === 'connected' ? 'secondary' : 'tertiary'}
              />
            ),
            onPress: () => {},
            accessibilityLabel: 'Connection Status',
          },
        ]}
      />

      {/* Date Divider Badge */}
      <View style={styles.dateSeparatorRow}>
        <View style={[styles.dateBadge, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Text style={[typography.label, { color: colors.textMuted, fontSize: 10 }]}>TODAY</Text>
        </View>
      </View>

      {/* Message List */}
      <View style={styles.messageListContainer}>
        <StateWrapper
          state={screenState}
          errorMessage={errorMessage}
          onRetry={initChat}
          emptyTitle="No Messages Yet"
          emptySubtitle="Say hello to start communicating with your project team!"
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 16 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        </StateWrapper>
      </View>

      {/* Composer Input Bar */}
      <View
        style={[
          styles.composerContainer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingHorizontal: spacing.screenPadding,
            paddingVertical: spacing.sm,
          },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Add attachment"
          onPress={handleAttachment}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.attachButton, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text style={{ fontSize: 18, color: colors.text }}>+</Text>
        </TouchableOpacity>

        <TextInput
          style={[
            styles.composerInput,
            {
              backgroundColor: colors.surfaceMuted,
              color: colors.text,
              borderColor: colors.border,
              borderRadius: borderRadius.pill,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
          style={[
            styles.sendButton,
            {
              backgroundColor: inputText.trim() ? colors.primary : colors.surfaceMuted,
              borderRadius: borderRadius.pill,
              marginLeft: spacing.xs + 2,
            },
          ]}
        >
          <Text
            style={[
              typography.label,
              { color: inputText.trim() ? '#FFFFFF' : colors.textMuted, fontWeight: '700' },
            ]}
          >
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateSeparatorRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  messageListContainer: {
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  messageBubble: {
    borderWidth: 1,
  },
  bubbleOwn: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
  },
  messageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  composerInput: {
    flex: 1,
    borderWidth: 1,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
