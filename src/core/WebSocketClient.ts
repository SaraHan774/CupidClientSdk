/**
 * WebSocketClient - STOMP over WebSocket 클라이언트
 * 실시간 메시징을 처리합니다.
 */

import {Client, IMessage, StompSubscription} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type {SDKConfig} from '../config/SDKConfig';
import type {ConnectionState, UnsubscribeFunction} from '../types';
import type {EventEmitter} from './EventEmitter';

export interface WebSocketClientConfig {
  serverUrl: string;
  wsEndpoint: string;
  autoReconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  debug: boolean;
}

export class WebSocketClient {
  private client: Client | null = null;
  private config: WebSocketClientConfig;
  private eventEmitter: EventEmitter;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private currentToken: string | null = null;

  constructor(config: SDKConfig, eventEmitter: EventEmitter) {
    this.config = {
      serverUrl: config.serverUrl,
      wsEndpoint: config.wsEndpoint ?? '/ws',
      autoReconnect: config.autoReconnect ?? true,
      reconnectInterval: config.reconnectInterval ?? 3000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
      debug: config.debug ?? false,
    };
    this.eventEmitter = eventEmitter;
  }

  /**
   * WebSocket 연결
   */
  async connect(token: string): Promise<void> {
    if (this.connectionState === 'connected') {
      this.log('Already connected');
      return;
    }

    this.currentToken = token;
    this.setConnectionState('connecting');

    return new Promise((resolve, reject) => {
      const wsUrl = `${this.config.serverUrl}${this.config.wsEndpoint}`;

      this.client = new Client({
        webSocketFactory: () => new SockJS(wsUrl) as WebSocket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: this.config.debug ? str => console.log('[STOMP]', str) : () => {},
        reconnectDelay: this.config.reconnectInterval,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        onConnect: () => {
          this.log('Connected to WebSocket');
          this.setConnectionState('connected');
          this.reconnectAttempts = 0;
          this.eventEmitter.emit('connection.connected');
          resolve();
        },

        onStompError: frame => {
          this.log('STOMP error:', frame.headers.message);
          this.setConnectionState('failed');
          this.eventEmitter.emit('connection.error', {
            error: new Error(frame.headers.message || 'STOMP error'),
          });
          reject(new Error(frame.headers.message || 'STOMP connection failed'));
        },

        onWebSocketClose: () => {
          this.log('WebSocket closed');
          if (this.connectionState !== 'disconnected') {
            this.handleDisconnection();
          }
        },

        onWebSocketError: event => {
          this.log('WebSocket error:', event);
          this.eventEmitter.emit('connection.error', {
            error: new Error('WebSocket error'),
          });
        },
      });

      this.client.activate();
    });
  }

  /**
   * WebSocket 연결 해제
   */
  async disconnect(): Promise<void> {
    this.setConnectionState('disconnected');

    // 모든 구독 해제
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();

    if (this.client?.active) {
      await this.client.deactivate();
    }

    this.client = null;
    this.currentToken = null;
    this.eventEmitter.emit('connection.disconnected', {reason: 'manual'});
    this.log('Disconnected from WebSocket');
  }

  /**
   * 토픽 구독
   */
  subscribe<T = unknown>(
    destination: string,
    callback: (data: T) => void,
  ): UnsubscribeFunction {
    if (!this.client?.active) {
      console.warn('[WebSocketClient] Cannot subscribe: not connected');
      return () => {};
    }

    // 이미 구독 중이면 기존 구독 해제
    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination)?.unsubscribe();
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const data = JSON.parse(message.body) as T;
        callback(data);
      } catch (error) {
        this.log('Failed to parse message:', error);
        callback(message.body as unknown as T);
      }
    });

    this.subscriptions.set(destination, subscription);
    this.log(`Subscribed to: ${destination}`);

    return () => {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
      this.log(`Unsubscribed from: ${destination}`);
    };
  }

  /**
   * 메시지 전송
   */
  send(destination: string, body: unknown): void {
    if (!this.client?.active) {
      console.warn('[WebSocketClient] Cannot send: not connected');
      return;
    }

    this.client.publish({
      destination,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });

    this.log(`Sent to ${destination}:`, body);
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.connectionState === 'connected' && (this.client?.active ?? false);
  }

  /**
   * 연결 상태 반환
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * 연결 끊김 처리
   */
  private handleDisconnection(): void {
    const previousState = this.connectionState;
    this.setConnectionState('disconnected');
    this.eventEmitter.emit('connection.disconnected', {reason: 'connection_lost'});

    // 자동 재연결
    if (
      this.config.autoReconnect &&
      previousState === 'connected' &&
      this.currentToken
    ) {
      this.attemptReconnect();
    }
  }

  /**
   * 재연결 시도
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('Max reconnect attempts reached');
      this.setConnectionState('failed');
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState('reconnecting');
    this.eventEmitter.emit('connection.reconnecting', {
      attempt: this.reconnectAttempts,
    });
    this.log(`Reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);

    setTimeout(async () => {
      if (this.currentToken && this.connectionState === 'reconnecting') {
        try {
          await this.connect(this.currentToken);
          // 재연결 성공 시 기존 구독 복원
          this.restoreSubscriptions();
        } catch (error) {
          this.log('Reconnect failed:', error);
          this.attemptReconnect();
        }
      }
    }, this.config.reconnectInterval);
  }

  /**
   * 구독 복원 (재연결 후)
   */
  private restoreSubscriptions(): void {
    // 구독은 자동으로 복원되지 않음
    // 사용자가 직접 재구독해야 함
    this.log('Connection restored. Subscriptions need to be re-established.');
  }

  /**
   * 연결 상태 업데이트
   */
  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.log(`Connection state: ${state}`);
  }

  /**
   * 디버그 로그
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[WebSocketClient]', ...args);
    }
  }
}
