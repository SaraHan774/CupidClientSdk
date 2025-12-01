/**
 * useReadReceipts - 읽음 표시 Hook
 */

import {useState, useEffect, useCallback, useRef} from 'react';
import {useRequiredChatSDK, useChatSDK} from './ChatSDKProvider';

interface UseReadReceiptsOptions {
  /** 자동 구독 여부 */
  autoSubscribe?: boolean;
  /** 화면에 보일 때 자동 읽음 처리 */
  autoMarkAsRead?: boolean;
}

interface UseReadReceiptsReturn {
  /** 메시지별 읽은 사용자 ID 맵 */
  readReceipts: Map<string, string[]>;
  /** 특정 메시지를 읽은 사용자 ID 가져오기 */
  getReadBy: (messageId: string) => string[];
  /** 메시지 읽음 처리 */
  markAsRead: (messageId: string) => Promise<void>;
  /** 여러 메시지 일괄 읽음 처리 */
  markMultipleAsRead: (messageIds: string[]) => Promise<void>;
  /** 마지막 메시지까지 읽음 처리 */
  markAllAsRead: () => Promise<void>;
  /** 로딩 상태 */
  loading: boolean;
}

export function useReadReceipts(
  channelId: string,
  options: UseReadReceiptsOptions = {},
): UseReadReceiptsReturn {
  const {autoSubscribe = true, autoMarkAsRead = false} = options;
  const sdk = useRequiredChatSDK();
  const {currentUserId} = useChatSDK();

  const [readReceipts, setReadReceipts] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(false);

  // 처리 중인 메시지 추적 (중복 요청 방지)
  const pendingReadsRef = useRef<Set<string>>(new Set());

  // 읽음 표시 이벤트 구독
  useEffect(() => {
    if (!autoSubscribe || !channelId) {
      return;
    }

    const unsubscribe = sdk.messages.onReadReceipt((receipt) => {
      if (receipt.channelId !== channelId) {
        return;
      }

      setReadReceipts(prev => {
        const newMap = new Map(prev);
        const readers = newMap.get(receipt.messageId) || [];

        // 중복 체크
        if (!readers.includes(receipt.userId)) {
          newMap.set(receipt.messageId, [...readers, receipt.userId]);
        }

        return newMap;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [sdk, channelId, autoSubscribe]);

  // 특정 메시지를 읽은 사용자 가져오기
  const getReadBy = useCallback(
    (messageId: string): string[] => {
      return readReceipts.get(messageId) || [];
    },
    [readReceipts],
  );

  // 단일 메시지 읽음 처리
  const markAsRead = useCallback(
    async (messageId: string): Promise<void> => {
      // 이미 처리 중이면 스킵
      if (pendingReadsRef.current.has(messageId)) {
        return;
      }

      // 이미 읽은 메시지면 스킵
      const readers = readReceipts.get(messageId) || [];
      if (currentUserId && readers.includes(currentUserId)) {
        return;
      }

      pendingReadsRef.current.add(messageId);

      try {
        await sdk.messages.markAsRead(channelId, messageId);

        // 낙관적 업데이트
        if (currentUserId) {
          setReadReceipts(prev => {
            const newMap = new Map(prev);
            const readers = newMap.get(messageId) || [];
            if (!readers.includes(currentUserId)) {
              newMap.set(messageId, [...readers, currentUserId]);
            }
            return newMap;
          });
        }
      } finally {
        pendingReadsRef.current.delete(messageId);
      }
    },
    [sdk, channelId, currentUserId, readReceipts],
  );

  // 여러 메시지 일괄 읽음 처리
  const markMultipleAsRead = useCallback(
    async (messageIds: string[]): Promise<void> => {
      setLoading(true);

      try {
        // 아직 읽지 않은 메시지만 필터링
        const unreadIds = messageIds.filter(id => {
          const readers = readReceipts.get(id) || [];
          return !currentUserId || !readers.includes(currentUserId);
        });

        // 순차적으로 처리 (서버 부하 방지)
        for (const messageId of unreadIds) {
          await markAsRead(messageId);
        }
      } finally {
        setLoading(false);
      }
    },
    [markAsRead, readReceipts, currentUserId],
  );

  // 마지막 메시지까지 읽음 처리
  const markAllAsRead = useCallback(async (): Promise<void> => {
    // 채널의 마지막 메시지 ID를 가져와서 처리
    // 실제 구현은 서버 API에 따라 다를 수 있음
    try {
      const response = await sdk.messages.list(channelId, {page: 0, size: 1});
      if (response.content.length > 0) {
        await markAsRead(response.content[0].id);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [sdk, channelId, markAsRead]);

  return {
    readReceipts,
    getReadBy,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    loading,
  };
}