/**
 * ChatSDKProvider - React Context Provider for ChatSDK
 * SDK를 React 컴포넌트에서 사용할 수 있도록 Context를 제공합니다.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {ChatSDK} from '../ChatSDK';
import type {SDKConfig, ConnectOptions} from '../config/SDKConfig';
import type {ConnectionState} from '../types';

interface ChatSDKContextValue {
  sdk: ChatSDK | null;
  isInitialized: boolean;
  isConnected: boolean;
  connectionState: ConnectionState;
  currentUserId: string | null;
  connect: (options: ConnectOptions) => Promise<void>;
  disconnect: () => Promise<void>;
  error: Error | null;
}

const ChatSDKContext = createContext<ChatSDKContextValue | null>(null);

interface ChatSDKProviderProps {
  children: ReactNode;
  config: SDKConfig;
  autoConnect?: boolean;
  connectOptions?: ConnectOptions;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export function ChatSDKProvider({
  children,
  config,
  autoConnect = false,
  connectOptions,
  onConnected,
  onDisconnected,
  onError,
}: ChatSDKProviderProps): React.JSX.Element {
  const [sdk, setSdk] = useState<ChatSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // SDK 초기화
  useEffect(() => {
    const instance = ChatSDK.initialize(config);
    setSdk(instance);
    setIsInitialized(true);

    // 연결 상태 이벤트 구독
    const unsubConnected = instance.onConnected(() => {
      setIsConnected(true);
      setConnectionState('connected');
      setCurrentUserId(instance.getCurrentUserId());
      setError(null);
      onConnected?.();
    });

    const unsubDisconnected = instance.onDisconnected(() => {
      setIsConnected(false);
      setConnectionState('disconnected');
      setCurrentUserId(null);
      onDisconnected?.();
    });

    const unsubReconnecting = instance.onReconnecting(({attempt}) => {
      setConnectionState('reconnecting');
    });

    const unsubError = instance.onConnectionError(({error: connError}) => {
      setConnectionState('failed');
      setError(connError);
      onError?.(connError);
    });

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubReconnecting();
      unsubError();
    };
  }, [config, onConnected, onDisconnected, onError]);

  // 자동 연결
  useEffect(() => {
    if (autoConnect && sdk && connectOptions && !isConnected) {
      sdk.connect(connectOptions).catch(err => {
        setError(err);
        onError?.(err);
      });
    }
  }, [autoConnect, sdk, connectOptions, isConnected, onError]);

  const connect = useCallback(
    async (options: ConnectOptions) => {
      if (!sdk) {
        throw new Error('SDK not initialized');
      }
      setConnectionState('connecting');
      try {
        await sdk.connect(options);
      } catch (err) {
        setConnectionState('failed');
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [sdk],
  );

  const disconnect = useCallback(async () => {
    if (!sdk) {
      return;
    }
    await sdk.disconnect();
  }, [sdk]);

  const value = useMemo<ChatSDKContextValue>(
    () => ({
      sdk,
      isInitialized,
      isConnected,
      connectionState,
      currentUserId,
      connect,
      disconnect,
      error,
    }),
    [sdk, isInitialized, isConnected, connectionState, currentUserId, connect, disconnect, error],
  );

  return (
    <ChatSDKContext.Provider value={value}>
      {children}
    </ChatSDKContext.Provider>
  );
}

/**
 * useChatSDK - ChatSDK 인스턴스에 접근하는 Hook
 */
export function useChatSDK(): ChatSDKContextValue {
  const context = useContext(ChatSDKContext);

  if (!context) {
    throw new Error('useChatSDK must be used within a ChatSDKProvider');
  }

  return context;
}

/**
 * useChatSDKInstance - SDK 인스턴스만 반환 (null 체크 필요)
 */
export function useChatSDKInstance(): ChatSDK | null {
  const {sdk} = useChatSDK();
  return sdk;
}

/**
 * useRequiredChatSDK - SDK 인스턴스 반환 (null이면 에러)
 */
export function useRequiredChatSDK(): ChatSDK {
  const {sdk} = useChatSDK();

  if (!sdk) {
    throw new Error('ChatSDK is not initialized');
  }

  return sdk;
}