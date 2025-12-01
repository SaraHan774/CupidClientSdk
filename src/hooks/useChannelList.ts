/**
 * useChannelList - 채널 목록 Hook
 */

import {useState, useEffect, useCallback, useRef} from 'react';
import {useRequiredChatSDK} from './ChatSDKProvider';
import type {Channel, ListChannelsParams, ChannelType} from '../types/Channel';
import type {UnsubscribeFunction} from '../types/Common';

interface UseChannelListOptions {
  /** 자동 로드 여부 */
  autoFetch?: boolean;
  /** 페이지 사이즈 */
  pageSize?: number;
  /** 채널 타입 필터 */
  type?: ChannelType;
  /** 실시간 업데이트 구독 */
  autoSubscribe?: boolean;
}

interface UseChannelListReturn {
  /** 채널 목록 */
  channels: Channel[];
  /** 로딩 상태 */
  loading: boolean;
  /** 더 로드 중 */
  loadingMore: boolean;
  /** 에러 */
  error: Error | null;
  /** 더 있는지 여부 */
  hasMore: boolean;
  /** 새로고침 */
  refresh: () => Promise<void>;
  /** 더 로드 */
  loadMore: () => Promise<void>;
}

export function useChannelList(
  options: UseChannelListOptions = {},
): UseChannelListReturn {
  const {autoFetch = true, pageSize = 20, type, autoSubscribe = true} = options;
  const sdk = useRequiredChatSDK();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(0);

  // 채널 목록 로드
  const loadChannels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: ListChannelsParams = {
        page: 0,
        size: pageSize,
      };

      if (type) {
        params.type = type;
      }

      const response = await sdk.channels.list(params);
      setChannels(response.content);
      setHasMore(response.hasNext);
      pageRef.current = 0;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [sdk, pageSize, type]);

  // 더 로드
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const nextPage = pageRef.current + 1;
      const params: ListChannelsParams = {
        page: nextPage,
        size: pageSize,
      };

      if (type) {
        params.type = type;
      }

      const response = await sdk.channels.list(params);
      setChannels(prev => [...prev, ...response.content]);
      setHasMore(response.hasNext);
      pageRef.current = nextPage;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoadingMore(false);
    }
  }, [sdk, pageSize, type, loadingMore, hasMore]);

  // 자동 로드
  useEffect(() => {
    if (autoFetch) {
      loadChannels();
    }
  }, [autoFetch, loadChannels]);

  // 실시간 업데이트 구독
  useEffect(() => {
    if (!autoSubscribe) {
      return;
    }

    const unsubscribes: UnsubscribeFunction[] = [];

    // 채널 생성 이벤트
    unsubscribes.push(
      sdk.channels.onChannelCreated(({channel: newChannel}) => {
        // 필터 조건 확인
        if (type && newChannel.type !== type) {
          return;
        }
        setChannels(prev => {
          // 중복 체크
          if (prev.some(c => c.id === newChannel.id)) {
            return prev;
          }
          return [newChannel, ...prev];
        });
      }),
    );

    // 채널 업데이트 이벤트
    unsubscribes.push(
      sdk.channels.onChannelUpdated(({channel: updatedChannel}) => {
        setChannels(prev =>
          prev.map(c => (c.id === updatedChannel.id ? updatedChannel : c)),
        );
      }),
    );

    // 채널 삭제 이벤트
    unsubscribes.push(
      sdk.channels.onChannelDeleted(({channelId: deletedChannelId}) => {
        setChannels(prev => prev.filter(c => c.id !== deletedChannelId));
      }),
    );

    // 새 메시지 시 채널 정렬 업데이트
    unsubscribes.push(
      sdk.messages.onMessage(({channelId: msgChannelId, message}) => {
        setChannels(prev => {
          const channelIndex = prev.findIndex(c => c.id === msgChannelId);
          if (channelIndex === -1) {
            return prev;
          }

          const channel = prev[channelIndex];
          const updatedChannel = {
            ...channel,
            lastMessage: message,
            updatedAt: new Date(),
          };

          // 채널을 맨 위로 이동
          const newChannels = prev.filter(c => c.id !== msgChannelId);
          return [updatedChannel, ...newChannels];
        });
      }),
    );

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [sdk, autoSubscribe, type]);

  return {
    channels,
    loading,
    loadingMore,
    error,
    hasMore,
    refresh: loadChannels,
    loadMore,
  };
}