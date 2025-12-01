/**
 * useChatMessages - 메시지 목록 및 전송 Hook
 */

import {useState, useEffect, useCallback, useRef} from 'react';
import {useRequiredChatSDK, useChatSDK} from './ChatSDKProvider';
import type {Message, SendMessageParams, ListMessagesParams} from '../types/Message';
import type {PaginatedResponse, UnsubscribeFunction} from '../types/Common';

interface UseChatMessagesOptions {
  autoFetch?: boolean;
  pageSize?: number;
  autoSubscribe?: boolean;
}

interface UseChatMessagesReturn {
  messages: Message[];
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  sendMessage: (params: SendMessageParams) => Promise<Message>;
  editMessage: (messageId: string, content: string) => Promise<Message>;
  deleteMessage: (messageId: string) => Promise<void>;
}

export function useChatMessages(
  channelId: string,
  options: UseChatMessagesOptions = {},
): UseChatMessagesReturn {
  const {autoFetch = true, pageSize = 20, autoSubscribe = true} = options;
  const sdk = useRequiredChatSDK();
  const {currentUserId} = useChatSDK();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // 페이지네이션 정보
  const pageRef = useRef(0);

  // 메시지 로드
  const loadMessages = useCallback(
    async (params?: ListMessagesParams) => {
      if (!channelId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await sdk.messages.list(channelId, {
          page: 0,
          size: pageSize,
          ...params,
        });

        setMessages(response.content.reverse()); // 최신이 아래로
        setHasMore(response.hasNext);
        pageRef.current = 0;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [sdk, channelId, pageSize],
  );

  // 더 많은 메시지 로드
  const loadMore = useCallback(async () => {
    if (!channelId || loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const nextPage = pageRef.current + 1;
      const response = await sdk.messages.list(channelId, {
        page: nextPage,
        size: pageSize,
      });

      setMessages(prev => [...response.content.reverse(), ...prev]);
      setHasMore(response.hasNext);
      pageRef.current = nextPage;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoadingMore(false);
    }
  }, [sdk, channelId, pageSize, loadingMore, hasMore]);

  // 자동 로드
  useEffect(() => {
    if (autoFetch) {
      loadMessages();
    }
  }, [autoFetch, loadMessages]);

  // 실시간 메시지 구독
  useEffect(() => {
    if (!autoSubscribe || !channelId) {
      return;
    }

    const unsubscribes: UnsubscribeFunction[] = [];

    // 채널 메시지 구독
    unsubscribes.push(
      sdk.messages.subscribeToChannel(channelId, newMessage => {
        setMessages(prev => {
          // 중복 체크
          if (prev.some(m => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      }),
    );

    // 새 메시지 이벤트 (자신의 메시지 포함)
    unsubscribes.push(
      sdk.messages.onMessage(({channelId: eventChannelId, message: newMessage}) => {
        if (eventChannelId === channelId) {
          setMessages(prev => {
            // 중복 체크
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      }),
    );

    // 메시지 업데이트 이벤트
    unsubscribes.push(
      sdk.messages.onMessageUpdated(({channelId: eventChannelId, message: updatedMessage}) => {
        if (eventChannelId === channelId) {
          setMessages(prev =>
            prev.map(m => (m.id === updatedMessage.id ? updatedMessage : m)),
          );
        }
      }),
    );

    // 메시지 삭제 이벤트
    unsubscribes.push(
      sdk.messages.onMessageDeleted(({channelId: eventChannelId, messageId}) => {
        if (eventChannelId === channelId) {
          setMessages(prev =>
            prev.map(m =>
              m.id === messageId ? {...m, isDeleted: true, content: ''} : m,
            ),
          );
        }
      }),
    );

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [sdk, channelId, autoSubscribe]);

  // 메시지 전송
  const sendMessage = useCallback(
    async (params: SendMessageParams): Promise<Message> => {
      const message = await sdk.messages.send(channelId, params);

      // 낙관적 업데이트는 실시간 구독에서 처리되므로 여기서는 반환만
      return message;
    },
    [sdk, channelId],
  );

  // 메시지 수정
  const editMessage = useCallback(
    async (messageId: string, content: string): Promise<Message> => {
      const updatedMessage = await sdk.messages.edit(channelId, messageId, content);
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? updatedMessage : m)),
      );
      return updatedMessage;
    },
    [sdk, channelId],
  );

  // 메시지 삭제
  const deleteMessage = useCallback(
    async (messageId: string): Promise<void> => {
      await sdk.messages.delete(channelId, messageId);
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? {...m, isDeleted: true, content: ''} : m,
        ),
      );
    },
    [sdk, channelId],
  );

  return {
    messages,
    loading,
    loadingMore,
    error,
    hasMore,
    refresh: loadMessages,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
  };
}