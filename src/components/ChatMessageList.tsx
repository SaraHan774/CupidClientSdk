/**
 * ChatMessageList - 메시지 목록 컴포넌트
 * SDK의 useChatMessages와 design system의 MessageBubble을 결합합니다.
 */

import React, {useCallback, useRef, useMemo} from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type ListRenderItem,
} from 'react-native';
import {MessageBubble, TypingIndicator} from 'august-design-system/components';
import {useTheme} from 'august-design-system';
import {useChatMessages} from '../hooks/useChatMessages';
import {useTypingIndicator} from '../hooks/useTypingIndicator';
import {useReadReceipts} from '../hooks/useReadReceipts';
import {useChatSDK} from '../hooks/ChatSDKProvider';
import type {Message} from '../types/Message';

interface ChatMessageListProps {
  /** 채널 ID */
  channelId: string;
  /** 커스텀 메시지 렌더러 */
  renderMessage?: (message: Message, isMine: boolean) => React.ReactNode;
  /** 메시지 클릭 핸들러 */
  onMessagePress?: (message: Message) => void;
  /** 메시지 롱프레스 핸들러 */
  onMessageLongPress?: (message: Message) => void;
  /** 이미지 클릭 핸들러 */
  onImagePress?: (message: Message) => void;
  /** 파일 클릭 핸들러 */
  onFilePress?: (message: Message) => void;
  /** 재시도 핸들러 */
  onRetry?: (message: Message) => void;
  /** 타이핑 인디케이터 표시 여부 */
  showTypingIndicator?: boolean;
  /** 읽음 처리 자동화 */
  autoMarkAsRead?: boolean;
  /** 그룹 채팅 여부 */
  isGroupChat?: boolean;
  /** 컨테이너 스타일 */
  style?: ViewStyle;
  /** 컨텐츠 컨테이너 스타일 */
  contentContainerStyle?: ViewStyle;
  /** 로딩 인디케이터 커스텀 */
  LoadingComponent?: React.ComponentType;
  /** 빈 목록 컴포넌트 */
  EmptyComponent?: React.ComponentType;
}

/**
 * ChatMessageList
 *
 * 채팅 메시지 목록을 표시하는 컴포넌트입니다.
 * 자동으로 메시지를 로드하고 실시간 업데이트를 반영합니다.
 *
 * @example
 * ```tsx
 * <ChatMessageList
 *   channelId="channel-123"
 *   isGroupChat={false}
 *   showTypingIndicator
 *   onMessageLongPress={(msg) => showMessageOptions(msg)}
 * />
 * ```
 */
export function ChatMessageList({
  channelId,
  renderMessage,
  onMessagePress,
  onMessageLongPress,
  onImagePress,
  onFilePress,
  onRetry,
  showTypingIndicator = true,
  autoMarkAsRead = true,
  isGroupChat = false,
  style,
  contentContainerStyle,
  LoadingComponent,
  EmptyComponent,
}: ChatMessageListProps): React.JSX.Element {
  const {theme} = useTheme();
  const {currentUserId} = useChatSDK();

  // 그룹된 메시지 타입
  type GroupedMessage = Message & {isFirstInGroup: boolean; isLastInGroup: boolean};

  const flatListRef = useRef<FlatList<GroupedMessage>>(null);

  // SDK Hooks
  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = useChatMessages(channelId);

  const {typingUserIds} = useTypingIndicator(channelId);
  const {markAsRead} = useReadReceipts(channelId, {autoMarkAsRead});

  // 메시지 그룹핑 (연속된 같은 발신자)
  const groupedMessages = useMemo(() => {
    return messages.map((message, index) => {
      const prevMessage = messages[index - 1];
      const nextMessage = messages[index + 1];

      const isFirstInGroup =
        !prevMessage || prevMessage.senderId !== message.senderId;
      const isLastInGroup =
        !nextMessage || nextMessage.senderId !== message.senderId;

      return {
        ...message,
        isFirstInGroup,
        isLastInGroup,
      };
    });
  }, [messages]);

  // 메시지 타입 변환
  const getMessageType = (message: Message): 'text' | 'image' | 'file' => {
    if (message.type === 'IMAGE') return 'image';
    if (message.type === 'FILE') return 'file';
    return 'text';
  };

  // 메시지 상태 변환
  const getMessageStatus = (
    message: Message,
  ): 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | undefined => {
    if (message.status === 'sending') return 'sending';
    if (message.status === 'sent') return 'sent';
    if (message.status === 'delivered') return 'delivered';
    if (message.status === 'read') return 'read';
    if (message.status === 'failed') return 'failed';
    return 'sent';
  };

  // 메시지 아이템 렌더러
  const renderItem: ListRenderItem<GroupedMessage> = useCallback(
    ({item: message}) => {
      const isMine = message.senderId === currentUserId;

      // 커스텀 렌더러가 있으면 사용
      if (renderMessage) {
        return <>{renderMessage(message, isMine)}</>;
      }

      return (
        <MessageBubble
          type={getMessageType(message)}
          text={message.content}
          direction={isMine ? 'outgoing' : 'incoming'}
          status={isMine ? getMessageStatus(message) : undefined}
          timestamp={message.createdAt}
          isGroup={isGroupChat}
          senderName={message.sender?.nickname || message.sender?.username}
          showSenderName={isGroupChat && !isMine && message.isFirstInGroup}
          isDeleted={message.isDeleted}
          isFirstInGroup={message.isFirstInGroup}
          isLastInGroup={message.isLastInGroup}
          image={
            message.type === 'IMAGE' && message.metadata
              ? {
                  source: {uri: message.metadata.imageUrl as string},
                  width: message.metadata.width as number,
                  height: message.metadata.height as number,
                  blurHash: message.metadata.blurhash as string,
                }
              : undefined
          }
          file={
            message.type === 'FILE' && message.metadata
              ? {
                  name: message.metadata.fileName as string,
                  size: message.metadata.fileSize as number,
                  mimeType: message.metadata.mimeType as string,
                }
              : undefined
          }
          onPress={onMessagePress ? () => onMessagePress(message) : undefined}
          onLongPress={onMessageLongPress ? () => onMessageLongPress(message) : undefined}
          onImagePress={onImagePress ? () => onImagePress(message) : undefined}
          onFilePress={onFilePress ? () => onFilePress(message) : undefined}
          onRetry={onRetry ? () => onRetry(message) : undefined}
          testID={`message-${message.id}`}
        />
      );
    },
    [
      currentUserId,
      isGroupChat,
      renderMessage,
      onMessagePress,
      onMessageLongPress,
      onImagePress,
      onFilePress,
      onRetry,
    ],
  );

  // 메시지가 화면에 보일 때 읽음 처리
  const handleViewableItemsChanged = useCallback(
    ({viewableItems}: {viewableItems: Array<{item: Message}>}) => {
      if (!autoMarkAsRead) return;

      viewableItems.forEach(({item}) => {
        if (item.senderId !== currentUserId && item.status !== 'read') {
          markAsRead(item.id);
        }
      });
    },
    [autoMarkAsRead, currentUserId, markAsRead],
  );

  // 타이핑 인디케이터 렌더
  const renderTypingIndicator = useCallback(() => {
    if (!showTypingIndicator || typingUserIds.length === 0) {
      return null;
    }

    return (
      <View style={styles.typingContainer}>
        <TypingIndicator
          isTyping
          variant="bubble"
          typingUsers={typingUserIds}
        />
      </View>
    );
  }, [showTypingIndicator, typingUserIds]);

  // 로딩 상태
  if (loading && messages.length === 0) {
    if (LoadingComponent) {
      return <LoadingComponent />;
    }
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color={theme.colors.interactive.tint} />
      </View>
    );
  }

  // 빈 목록
  if (!loading && messages.length === 0) {
    if (EmptyComponent) {
      return <EmptyComponent />;
    }
    return <View style={[styles.emptyContainer, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <FlatList<GroupedMessage>
        ref={flatListRef}
        data={groupedMessages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        inverted
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{itemVisiblePercentThreshold: 50}}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.loadingMore} /> : null}
        ListHeaderComponent={renderTypingIndicator}
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  typingContainer: {
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  loadingMore: {
    paddingVertical: 16,
  },
});