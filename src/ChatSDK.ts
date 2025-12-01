/**
 * ChatSDK - Main SDK Class
 * SDK의 메인 클래스입니다.
 */

import {SDKConfig, ConnectOptions, DEFAULT_CONFIG} from './config/SDKConfig';
import {AuthManager} from './core/AuthManager';
import {HttpClient} from './core/HttpClient';
import {WebSocketClient} from './core/WebSocketClient';
import {EventEmitter} from './core/EventEmitter';
import {ChannelModule} from './modules/ChannelModule';
import {MessageModule} from './modules/MessageModule';
import {UserModule} from './modules/UserModule';
import type {ConnectionState, UnsubscribeFunction} from './types';

export class ChatSDK {
  private static instance: ChatSDK | null = null;

  private config: SDKConfig;
  private authManager: AuthManager;
  private httpClient: HttpClient;
  private wsClient: WebSocketClient;
  private eventEmitter: EventEmitter;

  // 공개 모듈
  public readonly channels: ChannelModule;
  public readonly messages: MessageModule;
  public readonly users: UserModule;

  private constructor(config: SDKConfig) {
    // 기본 설정 병합
    this.config = {...DEFAULT_CONFIG, ...config} as SDKConfig;

    // 코어 컴포넌트 초기화
    this.eventEmitter = new EventEmitter();
    this.authManager = new AuthManager();
    this.httpClient = new HttpClient(this.config, this.authManager);
    this.wsClient = new WebSocketClient(this.config, this.eventEmitter);

    // 모듈 초기화
    this.channels = new ChannelModule(
      this.httpClient,
      this.wsClient,
      this.eventEmitter,
    );
    this.messages = new MessageModule(
      this.httpClient,
      this.wsClient,
      this.eventEmitter,
    );
    this.users = new UserModule(this.httpClient);

    this.log('ChatSDK initialized');
  }

  /**
   * SDK 초기화 (싱글톤)
   */
  static initialize(config: SDKConfig): ChatSDK {
    if (!ChatSDK.instance) {
      ChatSDK.instance = new ChatSDK(config);
    } else {
      console.warn('[ChatSDK] SDK already initialized. Returning existing instance.');
    }
    return ChatSDK.instance;
  }

  /**
   * 기존 인스턴스 반환
   */
  static getInstance(): ChatSDK | null {
    return ChatSDK.instance;
  }

  /**
   * SDK 리셋 (테스트용)
   */
  static reset(): void {
    if (ChatSDK.instance) {
      ChatSDK.instance.disconnect();
      ChatSDK.instance = null;
    }
  }

  /**
   * 채팅 서버 연결
   */
  async connect(options: ConnectOptions): Promise<void> {
    this.log('Connecting to chat server...');

    // 1. 토큰 설정
    await this.authManager.setTokens(options.accessToken, options.refreshToken);

    // 2. WebSocket 연결
    await this.wsClient.connect(options.accessToken);

    // 3. 기본 구독 설정
    this.setupDefaultSubscriptions();

    this.log('Connected successfully');
  }

  /**
   * 기본 WebSocket 구독 설정
   */
  private setupDefaultSubscriptions(): void {
    // 개인 메시지 큐 구독
    this.messages.subscribeToUserMessages(message => {
      this.log('Received message:', message.id);
    });
  }

  /**
   * 연결 해제
   */
  async disconnect(): Promise<void> {
    this.log('Disconnecting...');

    await this.wsClient.disconnect();
    await this.authManager.clear();
    this.eventEmitter.removeAllListeners();

    this.log('Disconnected');
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.wsClient.isConnected();
  }

  /**
   * 연결 상태 반환
   */
  getConnectionState(): ConnectionState {
    return this.wsClient.getConnectionState();
  }

  /**
   * 현재 사용자 ID 반환
   */
  getCurrentUserId(): string | null {
    return this.authManager.getUserId();
  }

  /**
   * 토큰 갱신 콜백 설정
   */
  setTokenRefreshCallback(
    callback: () => Promise<{accessToken: string; refreshToken?: string}>,
  ): void {
    this.authManager.setTokenRefreshCallback(callback);
  }

  // ===== 이벤트 리스너 =====

  /**
   * 연결 성공 이벤트 구독
   */
  onConnected(callback: () => void): UnsubscribeFunction {
    return this.eventEmitter.on('connection.connected', callback);
  }

  /**
   * 연결 해제 이벤트 구독
   */
  onDisconnected(callback: (data: {reason?: string}) => void): UnsubscribeFunction {
    return this.eventEmitter.on('connection.disconnected', callback);
  }

  /**
   * 재연결 시도 이벤트 구독
   */
  onReconnecting(callback: (data: {attempt: number}) => void): UnsubscribeFunction {
    return this.eventEmitter.on('connection.reconnecting', callback);
  }

  /**
   * 연결 에러 이벤트 구독
   */
  onConnectionError(callback: (data: {error: Error}) => void): UnsubscribeFunction {
    return this.eventEmitter.on('connection.error', callback);
  }

  // ===== 내부 접근자 (고급 사용) =====

  /**
   * EventEmitter 접근 (고급 사용)
   */
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }

  /**
   * HttpClient 접근 (고급 사용)
   */
  getHttpClient(): HttpClient {
    return this.httpClient;
  }

  /**
   * WebSocketClient 접근 (고급 사용)
   */
  getWebSocketClient(): WebSocketClient {
    return this.wsClient;
  }

  /**
   * 디버그 로그
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[ChatSDK]', ...args);
    }
  }
}
