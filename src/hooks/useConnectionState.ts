/**
 * useConnectionState - 연결 상태 관리 Hook
 */

import {useState, useEffect, useCallback} from 'react';
import {useChatSDK} from './ChatSDKProvider';
import type {ConnectionState} from '../types/Common';

interface UseConnectionStateReturn {
  /** 현재 연결 상태 */
  connectionState: ConnectionState;
  /** 연결됨 여부 */
  isConnected: boolean;
  /** 연결 중 여부 */
  isConnecting: boolean;
  /** 재연결 중 여부 */
  isReconnecting: boolean;
  /** 연결 실패 여부 */
  isFailed: boolean;
  /** 연결 해제됨 여부 */
  isDisconnected: boolean;
  /** 마지막 에러 */
  error: Error | null;
  /** 재연결 시도 횟수 */
  reconnectAttempt: number;
}

export function useConnectionState(): UseConnectionStateReturn {
  const {sdk, connectionState, isConnected, error} = useChatSDK();

  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // 재연결 시도 횟수 추적
  useEffect(() => {
    if (!sdk) {
      return;
    }

    const unsubscribe = sdk.onReconnecting(({attempt}) => {
      setReconnectAttempt(attempt);
    });

    return () => {
      unsubscribe();
    };
  }, [sdk]);

  // 연결 성공 시 재시도 횟수 리셋
  useEffect(() => {
    if (isConnected) {
      setReconnectAttempt(0);
    }
  }, [isConnected]);

  return {
    connectionState,
    isConnected,
    isConnecting: connectionState === 'connecting',
    isReconnecting: connectionState === 'reconnecting',
    isFailed: connectionState === 'failed',
    isDisconnected: connectionState === 'disconnected',
    error,
    reconnectAttempt,
  };
}

/**
 * useAutoReconnect - 자동 재연결 로직
 */
interface UseAutoReconnectOptions {
  /** 재연결 활성화 여부 */
  enabled?: boolean;
  /** 최대 재시도 횟수 */
  maxAttempts?: number;
  /** 재시도 간격 (ms) */
  retryInterval?: number;
  /** 재연결 성공 콜백 */
  onReconnected?: () => void;
  /** 재연결 실패 콜백 */
  onReconnectFailed?: (error: Error) => void;
}

export function useAutoReconnect(options: UseAutoReconnectOptions = {}): void {
  const {
    enabled = true,
    maxAttempts = 5,
    retryInterval = 3000,
    onReconnected,
    onReconnectFailed,
  } = options;

  const {sdk, isConnected, connectionState} = useChatSDK();
  const {reconnectAttempt} = useConnectionState();

  useEffect(() => {
    if (!enabled || !sdk) {
      return;
    }

    // 연결 성공 콜백
    if (isConnected && reconnectAttempt > 0) {
      onReconnected?.();
    }

    // 최대 재시도 횟수 초과
    if (connectionState === 'failed' && reconnectAttempt >= maxAttempts) {
      onReconnectFailed?.(new Error(`Reconnection failed after ${maxAttempts} attempts`));
    }
  }, [
    enabled,
    sdk,
    isConnected,
    connectionState,
    reconnectAttempt,
    maxAttempts,
    onReconnected,
    onReconnectFailed,
  ]);
}