/**
 * Chat SDK Entry Point
 * SDK의 진입점입니다.
 */

// Main SDK Class
export {ChatSDK} from './ChatSDK';

// Config
export type {SDKConfig, ConnectOptions} from './config/SDKConfig';
export {DEFAULT_CONFIG} from './config/SDKConfig';

// Core Classes (for advanced usage)
export {EventEmitter} from './core/EventEmitter';
export {AuthManager} from './core/AuthManager';
export {HttpClient} from './core/HttpClient';
export {WebSocketClient} from './core/WebSocketClient';

// Modules
export {ChannelModule, MessageModule, UserModule} from './modules';

// React Hooks
export {
  // Provider & Context
  ChatSDKProvider,
  useChatSDK,
  useChatSDKInstance,
  useRequiredChatSDK,
  // Channel Hooks
  useChatChannel,
  useChannelList,
  // Message Hooks
  useChatMessages,
  // Real-time Hooks
  useTypingIndicator,
  useReadReceipts,
  // Connection Hooks
  useConnectionState,
  useAutoReconnect,
} from './hooks';

// UI Components (Phase 3)
export {
  // Combined Provider
  ChatProvider,
  // Message Components
  ChatMessageList,
  ChatInput,
  // Channel Components
  ChatChannelList,
  // Screen Components
  ChatScreen,
} from './components';

// Types
export * from './types';

// Default export
export {ChatSDK as default} from './ChatSDK';
