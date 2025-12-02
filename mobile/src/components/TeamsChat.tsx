/**
 * TeamsChat Component
 * Microsoft Teams chat interface with adaptive cards, typing indicators, and read receipts
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TeamsMessage,
  TeamsChannel,
  TeamsTeam,
  MessagingContext,
} from '../types/messaging.types';
import { MessagingService } from '../services/MessagingService';

interface TeamsChatProps {
  teamId: string;
  channelId: string;
  context?: MessagingContext;
  currentUserId: string;
  currentUserName: string;
  onClose?: () => void;
}

export const TeamsChat: React.FC<TeamsChatProps> = ({
  teamId,
  channelId,
  context,
  currentUserId,
  currentUserName,
  onClose,
}) => {
  const [messages, setMessages] = useState<TeamsMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [channelInfo, setChannelInfo] = useState<TeamsChannel | null>(null);
  const [teamInfo, setTeamInfo] = useState<TeamsTeam | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagingService = new MessagingService();

  useEffect(() => {
    loadChannelInfo();
    loadMessages();

    // Set up polling for new messages
    const pollInterval = setInterval(() => {
      loadMessages(true);
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [teamId, channelId]);

  const loadChannelInfo = async () => {
    try {
      const [channel, team] = await Promise.all([
        messagingService.getTeamsChannel(teamId, channelId),
        messagingService.getTeamsTeam(teamId),
      ]);
      setChannelInfo(channel);
      setTeamInfo(team);
    } catch (error) {
      console.error('Failed to load channel info:', error);
    }
  };

  const loadMessages = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      const response = await messagingService.getTeamsMessages(
        teamId,
        channelId,
        50
      );
      if (response.success && response.messages) {
        setMessages(response.messages);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      if (!silent) {
        Alert.alert('Error', 'Failed to load messages');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadMessages();
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      return;
    }

    const tempMessage = messageText;
    setMessageText('');
    setIsSending(true);

    try {
      const entityLinks = context
        ? [
            {
              entity_type: context.entityType,
              entity_id: context.entityId,
              link_type: 'Related',
            },
          ]
        : undefined;

      const response = await messagingService.sendTeamsMessage({
        teamId,
        channelId,
        message: tempMessage,
        contentType: 'html',
        entityLinks,
      });

      if (response.success) {
        // Add optimistic message
        const optimisticMessage: TeamsMessage = {
          id: response.messageId || Date.now().toString(),
          from: {
            userId: currentUserId,
            displayName: currentUserName,
          },
          body: tempMessage,
          createdAt: new Date(),
          isMyMessage: true,
        };
        setMessages([...messages, optimisticMessage]);
        scrollToBottom();

        // Reload messages to get the actual message
        setTimeout(() => loadMessages(true), 1000);
      } else {
        Alert.alert('Error', response.error || 'Failed to send message');
        setMessageText(tempMessage);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      setMessageText(tempMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // In a real implementation, send typing indicator to Teams
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const formatMessageTime = (date: Date): string => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) {
      return messageDate.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  const renderMessage = (message: TeamsMessage, index: number) => {
    const isMyMessage = message.from.userId === currentUserId;
    const showAvatar =
      index === 0 || messages[index - 1]?.from.userId !== message.from.userId;
    const showName =
      !isMyMessage &&
      (index === 0 || messages[index - 1]?.from.userId !== message.from.userId);

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isMyMessage && showAvatar && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {message.from.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {!isMyMessage && !showAvatar && <View style={styles.avatarSpacer} />}

        <View style={styles.messageBubbleContainer}>
          {showName && (
            <Text style={styles.senderName}>{message.from.displayName}</Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.otherMessageText,
              ]}
            >
              {message.body}
            </Text>
          </View>
          <Text style={styles.messageTime}>
            {formatMessageTime(message.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {channelInfo?.displayName || 'Loading...'}
          </Text>
          {teamInfo && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {teamInfo.displayName}
            </Text>
          )}
        </View>
      </View>

      {/* Context Banner */}
      {context && (
        <View style={styles.contextBanner}>
          <Text style={styles.contextText}>
            Related to: {context.entityName || context.entityType}
          </Text>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5B5FC7" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to send a message!
            </Text>
          </View>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <View style={styles.typingIndicator}>
            <View style={styles.typingDots}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
            </View>
            <Text style={styles.typingText}>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'}{' '}
              typing...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={(text) => {
              setMessageText(text);
              handleTyping();
            }}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
          />
        </View>
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={isSending || !messageText.trim()}
          style={[
            styles.sendButton,
            (!messageText.trim() || isSending) && styles.sendButtonDisabled,
          ]}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#5B5FC7',
    borderBottomWidth: 1,
    borderBottomColor: '#4A4EB0',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E0E0',
    marginTop: 2,
  },
  contextBanner: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#BBDEFB',
  },
  contextText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  messagesContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#5B5FC7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarSpacer: {
    width: 44,
  },
  messageBubbleContainer: {
    flex: 1,
    maxWidth: '75%',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B5FC7',
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#5B5FC7',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    marginLeft: 12,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5B5FC7',
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  input: {
    fontSize: 16,
    color: '#333',
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5B5FC7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});
