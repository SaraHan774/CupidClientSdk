/**
 * SDKConfig - SDK 설정 타입 정의
 */

export interface SDKConfig {
  /** Chat API 서버 URL */
  serverUrl: string;

  /** WebSocket 엔드포인트 (default: /ws) */
  wsEndpoint?: string;

  /** HTTP 요청 타임아웃 (ms, default: 30000) */
  timeout?: number;

  /** E2E 암호화 활성화 */
  enableE2EEncryption?: boolean;

  /** 디버그 로깅 활성화 */
  debug?: boolean;

  /** 자동 재연결 활성화 (default: true) */
  autoReconnect?: boolean;

  /** 재연결 시도 간격 (ms, default: 3000) */
  reconnectInterval?: number;

  /** 최대 재연결 시도 횟수 (default: 5) */
  maxReconnectAttempts?: number;
}

export interface ConnectOptions {
  /** JWT Access Token */
  accessToken: string;

  /** JWT Refresh Token (optional) */
  refreshToken?: string;

  /** 사용자 ID (optional, JWT에서 추출 가능) */
  userId?: string;
}

export const DEFAULT_CONFIG: Partial<SDKConfig> = {
  wsEndpoint: '/ws',
  timeout: 30000,
  enableE2EEncryption: false,
  debug: false,
  autoReconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
};