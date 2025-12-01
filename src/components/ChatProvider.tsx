/**
 * ChatProvider - Combined Provider for Chat SDK and Theme
 * ChatSDK와 Theme Provider를 결합한 통합 프로바이더입니다.
 */

import React, {type ReactNode} from 'react';
import {ThemeProvider} from 'august-design-system';
import {ChatSDKProvider} from '../hooks/ChatSDKProvider';
import type {SDKConfig, ConnectOptions} from '../config/SDKConfig';

interface ChatProviderProps {
  children: ReactNode;
  /** SDK 설정 */
  config: SDKConfig;
  /** 테마 설정 (august-design-system) - pass custom theme config */
  theme?: Parameters<typeof ThemeProvider>[0]['theme'];
  /** 자동 연결 여부 */
  autoConnect?: boolean;
  /** 자동 연결 시 사용할 옵션 */
  connectOptions?: ConnectOptions;
  /** 연결 성공 콜백 */
  onConnected?: () => void;
  /** 연결 해제 콜백 */
  onDisconnected?: () => void;
  /** 에러 콜백 */
  onError?: (error: Error) => void;
}

/**
 * ChatProvider
 *
 * SDK와 Theme을 한번에 설정할 수 있는 통합 프로바이더입니다.
 *
 * @example
 * ```tsx
 * import {ChatProvider} from '@cupid/chat-sdk';
 *
 * function App() {
 *   return (
 *     <ChatProvider
 *       config={{serverUrl: 'https://api.example.com'}}
 *       colorMode="system"
 *     >
 *       <NavigationContainer>
 *         <AppNavigator />
 *       </NavigationContainer>
 *     </ChatProvider>
 *   );
 * }
 * ```
 */
export function ChatProvider({
  children,
  config,
  theme,
  autoConnect = false,
  connectOptions,
  onConnected,
  onDisconnected,
  onError,
}: ChatProviderProps): React.JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <ChatSDKProvider
        config={config}
        autoConnect={autoConnect}
        connectOptions={connectOptions}
        onConnected={onConnected}
        onDisconnected={onDisconnected}
        onError={onError}>
        {children}
      </ChatSDKProvider>
    </ThemeProvider>
  );
}