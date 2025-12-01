/**
 * useTypingIndicator - 타이핑 인디케이터 Hook
 */

import {useState, useEffect, useCallback, useRef} from 'react';
import {useRequiredChatSDK, useChatSDK} from './ChatSDKProvider';

interface UseTypingIndicatorOptions {
  /** 타이핑 이벤트 자동 종료 시간 (ms) - 기본 3초 */
  typingTimeout?: number;
  /** 타이핑 이벤트 전송 간격 (ms) - 기본 2초 */
  sendInterval?: number;
}

interface UseTypingIndicatorReturn {
  /** 현재 타이핑 중인 사용자 ID 목록 */
  typingUserIds: string[];
  /** 타이핑 시작 */
  startTyping: () => void;
  /** 타이핑 종료 */
  stopTyping: () => void;
  /** 텍스트 입력 핸들러 (자동으로 타이핑 상태 관리) */
  handleTextChange: (text: string) => void;
  /** 본인이 현재 타이핑 중인지 */
  isTyping: boolean;
}

export function useTypingIndicator(
  channelId: string,
  options: UseTypingIndicatorOptions = {},
): UseTypingIndicatorReturn {
  const {typingTimeout = 3000, sendInterval = 2000} = options;
  const sdk = useRequiredChatSDK();
  const {currentUserId} = useChatSDK();

  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // 타이머 참조
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const userTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // 타이핑 이벤트 구독
  useEffect(() => {
    if (!channelId) {
      return;
    }

    const unsubscribe = sdk.channels.onTyping(channelId, (data: {userIds: string[]}) => {
      // 본인 제외한 타이핑 사용자 목록
      const filteredUserIds = data.userIds.filter(id => id !== currentUserId);
      setTypingUserIds(filteredUserIds);

      // 각 사용자별 타임아웃 설정 (자동 클리어)
      filteredUserIds.forEach(userId => {
        // 기존 타임아웃 클리어
        const existingTimeout = userTimeoutsRef.current.get(userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // 자동 종료 타임아웃 설정
        const timeout = setTimeout(() => {
          setTypingUserIds(prev => prev.filter(id => id !== userId));
          userTimeoutsRef.current.delete(userId);
        }, typingTimeout + 1000); // 여유 시간 추가

        userTimeoutsRef.current.set(userId, timeout);
      });
    });

    return () => {
      unsubscribe();
      // 모든 타임아웃 클리어
      userTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      userTimeoutsRef.current.clear();
    };
  }, [sdk, channelId, currentUserId, typingTimeout]);

  // 타이핑 시작
  const startTyping = useCallback(() => {
    if (!channelId || isTyping) {
      return;
    }

    const now = Date.now();
    // 너무 빈번한 전송 방지
    if (now - lastTypingSentRef.current < sendInterval) {
      return;
    }

    sdk.channels.startTyping(channelId);
    setIsTyping(true);
    lastTypingSentRef.current = now;

    // 기존 타임아웃 클리어
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 자동 종료 타임아웃
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, typingTimeout);
  }, [sdk, channelId, isTyping, sendInterval, typingTimeout]);

  // 타이핑 종료
  const stopTyping = useCallback(() => {
    if (!channelId || !isTyping) {
      return;
    }

    sdk.channels.stopTyping(channelId);
    setIsTyping(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [sdk, channelId, isTyping]);

  // 텍스트 변경 핸들러
  const handleTextChange = useCallback(
    (text: string) => {
      if (text.length > 0) {
        startTyping();
      } else {
        stopTyping();
      }
    },
    [startTyping, stopTyping],
  );

  // 언마운트 시 타이핑 종료
  useEffect(() => {
    return () => {
      if (isTyping && channelId) {
        sdk.channels.stopTyping(channelId);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [sdk, channelId, isTyping]);

  return {
    typingUserIds,
    startTyping,
    stopTyping,
    handleTextChange,
    isTyping,
  };
}