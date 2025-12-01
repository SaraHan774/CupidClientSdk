/**
 * EventEmitter - 이벤트 시스템
 * SDK 내부 이벤트 통신을 처리합니다.
 */

import type {UnsubscribeFunction} from '../types';

type EventCallback<T = unknown> = (data: T) => void;

export class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * 이벤트 리스너 등록
   */
  on<T = unknown>(event: string, callback: EventCallback<T>): UnsubscribeFunction {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const callbacks = this.listeners.get(event)!;
    callbacks.add(callback as EventCallback);

    // 구독 해제 함수 반환
    return () => {
      callbacks.delete(callback as EventCallback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * 한 번만 실행되는 이벤트 리스너 등록
   */
  once<T = unknown>(event: string, callback: EventCallback<T>): UnsubscribeFunction {
    const onceCallback: EventCallback<T> = (data: T) => {
      callback(data);
      unsubscribe();
    };

    const unsubscribe = this.on(event, onceCallback);
    return unsubscribe;
  }

  /**
   * 이벤트 발생
   */
  emit<T = unknown>(event: string, data?: T): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventEmitter] Error in event handler for "${event}":`, error);
        }
      });
    }
  }

  /**
   * 특정 이벤트의 리스너 제거
   */
  off(event: string, callback?: EventCallback): void {
    if (callback) {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    } else {
      this.listeners.delete(event);
    }
  }

  /**
   * 모든 리스너 제거
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * 특정 이벤트의 리스너 수 반환
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * 등록된 이벤트 목록 반환
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}

// SDK 이벤트 타입 정의
export type SDKEvents = {
  // 연결 이벤트
  'connection.connected': undefined;
  'connection.disconnected': {reason?: string};
  'connection.reconnecting': {attempt: number};
  'connection.error': {error: Error};

  // 메시지 이벤트
  'message.new': {channelId: string; message: unknown};
  'message.updated': {channelId: string; message: unknown};
  'message.deleted': {channelId: string; messageId: string};

  // 채널 이벤트
  'channel.created': {channel: unknown};
  'channel.updated': {channel: unknown};
  'channel.deleted': {channelId: string};
  'channel.member.joined': {channelId: string; userId: string};
  'channel.member.left': {channelId: string; userId: string};

  // 타이핑 이벤트
  'typing.start': {channelId: string; userId: string};
  'typing.stop': {channelId: string; userId: string};

  // 읽음 표시 이벤트
  'read.receipt': {channelId: string; messageId: string; userId: string};
};