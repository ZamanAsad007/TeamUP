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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
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

export const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
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

    // 1. Fetch initial history via REST endpoint as guaranteed baseline
    chatService
      .getProjectMessages(projectId)
      .then((history) => {
        setMessages(history || []);
        setScreenState(history && history.length > 0 ? 'populated' : 'empty');
        setErrorMessage(undefined);
      })
      .catch((err: any) => {
        // Even if REST fails, WebSocket may provide messages
        console.warn('Initial REST message fetch failed, connecting to WS:', err.message);
      });

    // 2. Connect to WebSocket & join room
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

    // Listen to connection status changes
    const unsubStatus = socketService.onStatusChange((status) => {
      setConnectionStatus(status);
      if (status === 'connected') {
        socketService.joinRoom(projectId);
      }
    });

    // Listen to incoming real-time broadcast messages
    const unsubNewMessage = socketService.onNewMessage((newMsg) => {
      if (newMsg.projectId !== projectId) return;

      setMessages((prev) => {
        // Reconcile: If there is an optimistic pending message matching this sender and content, replace it
        const pendingIndex = prev.findIndex(
          (m) => m.isPending && m.content === newMsg.content && m.senderId === newMsg.senderId
        );

        if (pendingIndex !== -1) {
          const updated = [...prev];
          updated[pendingIndex] = newMsg;
          return updated;
        }

        // Avoid duplicate messages
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

    // Listen to WebSocket history event
    const unsubHistory = socketService.onMessageHistory((history) => {
      if (Array.isArray(history)) {
        setMessages((prev) => {
          // Merge unique messages
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

    // Optimistically add to UI
    setMessages((prev) => [...prev, optimisticMessage]);
    setScreenState('populated');
    setInputText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    // Emit via WebSocket
    socketService.sendMessage(projectId, trimmed, (response) => {
      if (response && response.success && response.message) {
        // Reconcile optimistic message with server response
        const confirmedMsg = response.message;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...confirmedMsg, isPending: false } : m))
        );
      }
    });
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
          { marginBottom: spacing.sm },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isOwn ? colors.primaryContainer : colors.surfaceVariant,
              borderColor: colors.outlineVariant,
              borderRadius: borderRadius.bento,
              padding: spacing.sm,
            },
            isOwn ? styles.bubbleOwn : styles.bubbleOther,
          ]}
        >
          {!isOwn && (
            <Text style={[typography.labelMedium, { color: colors.primary, marginBottom: 2 }]}>
              {senderName}
            </Text>
          )}

          <Text
            style={[
              typography.bodyMedium,
              { color: isOwn ? colors.onPrimaryContainer : colors.onSurface },
            ]}
          >
            {item.content}
          </Text>

          <View style={styles.messageMetaRow}>
            <Text
              style={[
                typography.labelMedium,
                {
                  fontSize: 10,
                  color: isOwn ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                  opacity: 0.7,
                  marginTop: 2,
                },
              ]}
            >
              {timeFormatted} {item.isPending ? '• Sending...' : ''}
            </Text>
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
      {/* Top status bar */}
      <View style={[styles.topBanner, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
        <View style={styles.topBannerRow}>
          <Text style={[typography.titleMedium, { color: colors.onSurface }]} numberOfLines={1}>
            {projectTitle}
          </Text>
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
            contentContainerStyle={{ padding: spacing.md }}
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
            borderColor: colors.outlineVariant,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          },
        ]}
      >
        <TextInput
          style={[
            styles.composerInput,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurface,
              borderColor: colors.outlineVariant,
              borderRadius: borderRadius.pill,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
          style={[
            styles.sendButton,
            {
              backgroundColor: inputText.trim() ? colors.primary : colors.surfaceVariant,
              borderRadius: borderRadius.pill,
              marginLeft: spacing.sm,
            },
          ]}
        >
          <Text
            style={[
              typography.labelMedium,
              { color: inputText.trim() ? colors.onPrimary : colors.onSurfaceVariant, fontWeight: '700' },
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
  topBanner: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageListContainer: {
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    borderWidth: 1,
  },
  bubbleOwn: {
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    borderBottomLeftRadius: 2,
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
  composerInput: {
    flex: 1,
    borderWidth: 1,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
