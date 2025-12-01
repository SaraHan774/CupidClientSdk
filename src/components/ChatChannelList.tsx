/**
 * ChatChannelList - 채널 목록 컴포넌트
 * SDK의 useChannelList와 design system의 ConversationListItem을 결합합니다.
 */

import React, {useCallback} from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  type ViewStyle,
  type ListRenderItem,
} from 'react-native';
import {ConversationListItem} from 'august-design-system/components';
import {useTheme} from 'august-design-system';
import {useChannelList} from '../hooks/useChannelList';
import type {Channel, ChannelType} from '../types/Channel';

interface ChatChannelListProps {
  /** 채널 타입 필터 */
  type?: ChannelType;
  /** 채널 클릭 핸들러 */
  onChannelPress: (channel: Channel) => void;
  /** 채널 롱프레스 핸들러 */
  onChannelLongPress?: (channel: Channel) => void;
  /** 커스텀 채널 렌더러 */
  renderChannel?: (channel: Channel) => React.ReactNode;
  /** 컨테이너 스타일 */
  style?: ViewStyle;
  /** 컨텐츠 컨테이너 스타일 */
  contentContainerStyle?: ViewStyle;
  /** 로딩 컴포넌트 */
  LoadingComponent?: React.ComponentType;
  /** 빈 목록 컴포넌트 */
  EmptyComponent?: React.ComponentType;
  /** 구분선 표시 */
  showSeparator?: boolean;
}

/**
 * ChatChannelList
 *
 * 채팅 채널 목록을 표시하는 컴포넌트입니다.
 * 실시간으로 업데이트되며 새 메시지가 오면 자동 정렬됩니다.
 *
 * @example
 * ```tsx
 * <ChatChannelList
 *   onChannelPress={(channel) => navigation.navigate('Chat', {channelId: channel.id})}
 *   type="DIRECT"
 * />
 * ```
 */
export function ChatChannelList({
  type,
  onChannelPress,
  onChannelLongPress,
  renderChannel,
  style,
  contentContainerStyle,
  LoadingComponent,
  EmptyComponent,
  showSeparator = true,
}: ChatChannelListProps): React.JSX.Element {
  const {theme} = useTheme();

  // SDK Hook
  const {
    channels,
    loading,
    loadingMore,
    hasMore,
    refresh,
    loadMore,
  } = useChannelList({type});

  // 메시지 타입 변환
  const getMessageType = (
    channel: Channel,
  ): 'text' | 'image' | 'file' | 'voice' | 'system' => {
    if (!channel.lastMessage) return 'text';
    const type = channel.lastMessage.type;
    if (type === 'IMAGE') return 'image';
    if (type === 'FILE') return 'file';
    if (type === 'SYSTEM') return 'system';
    return 'text';
  };

  // 아바타 데이터 변환
  const getGroupAvatars = (channel: Channel) => {
    if (channel.type !== 'GROUP' || !channel.members) {
      return undefined;
    }

    return channel.members.slice(0, 3).map(member => ({
      source: member.user?.profileImageUrl
        ? {uri: member.user.profileImageUrl}
        : undefined,
      name: member.user?.nickname || member.user?.username || member.userId,
    }));
  };

  // 채널 아이템 렌더러
  const renderItem: ListRenderItem<Channel> = useCallback(
    ({item: channel}) => {
      // 커스텀 렌더러가 있으면 사용
      if (renderChannel) {
        return <>{renderChannel(channel)}</>;
      }

      const isGroup = channel.type === 'GROUP';
      const otherMember = !isGroup ? channel.members?.[0] : undefined;

      return (
        <ConversationListItem
          id={channel.id}
          title={channel.name || otherMember?.user?.nickname || otherMember?.user?.username || '알 수 없음'}
          subtitle={channel.lastMessage?.content}
          messageType={getMessageType(channel)}
          messageSender={
            isGroup && channel.lastMessage?.sender
              ? channel.lastMessage.sender.nickname || channel.lastMessage.sender.username
              : undefined
          }
          timestamp={channel.lastMessage?.createdAt || channel.updatedAt}
          avatarSource={
            !isGroup && otherMember?.user?.profileImageUrl
              ? {uri: otherMember.user.profileImageUrl}
              : undefined
          }
          avatarName={
            !isGroup
              ? otherMember?.user?.nickname || otherMember?.user?.username
              : channel.name
          }
          isGroup={isGroup}
          groupAvatars={getGroupAvatars(channel)}
          presenceStatus={
            !isGroup && otherMember?.user?.status
              ? otherMember.user.status === 'online'
                ? 'online'
                : 'offline'
              : undefined
          }
          unreadCount={channel.unreadCount}
          isPinned={channel.isPinned}
          isMuted={channel.isMuted}
          onPress={() => onChannelPress(channel)}
          onLongPress={
            onChannelLongPress ? () => onChannelLongPress(channel) : undefined
          }
          testID={`channel-${channel.id}`}
        />
      );
    },
    [renderChannel, onChannelPress, onChannelLongPress],
  );

  // 구분선 렌더러
  const renderSeparator = useCallback(() => {
    if (!showSeparator) return null;
    return (
      <View
        style={[
          styles.separator,
          {backgroundColor: theme.colors.separator.opaque},
        ]}
      />
    );
  }, [showSeparator, theme]);

  // 로딩 상태
  if (loading && channels.length === 0) {
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
  if (!loading && channels.length === 0) {
    if (EmptyComponent) {
      return <EmptyComponent />;
    }
    return <View style={[styles.emptyContainer, style]} />;
  }

  return (
    <FlatList
      data={channels}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      style={style}
      contentContainerStyle={contentContainerStyle}
      ItemSeparatorComponent={renderSeparator}
      onEndReached={hasMore ? loadMore : undefined}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator style={styles.loadingMore} /> : null
      }
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          tintColor={theme.colors.interactive.tint}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 76, // Avatar width + padding
  },
  loadingMore: {
    paddingVertical: 16,
  },
});