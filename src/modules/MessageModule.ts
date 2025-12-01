/**
 * MessageModule - 메시지 관리
 * 메시지의 전송, 조회, 수정, 삭제 등을 처리합니다.
 */

import type {HttpClient} from '../core/HttpClient';
import type {WebSocketClient} from '../core/WebSocketClient';
import type {EventEmitter} from '../core/EventEmitter';
import type {
  Message,
  SendMessageParams,
  ListMessagesParams,
  PaginatedResponse,
  UnsubscribeFunction,
  ReadReceipt,
} from '../types';

const API_ENDPOINTS = {
  MESSAGES: (channelId: string) => `/api/v1/chat/channels/${channelId}/messages`,
  MESSAGE: (channelId: string, messageId: string) =>
    `/api/v1/chat/channels/${channelId}/messages/${messageId}`,
  READ: (channelId: string, messageId: string) =>
    `/api/v1/chat/channels/${channelId}/messages/${messageId}/read`,
};

const WS_DESTINATIONS = {
  USER_MESSAGES: '/user/queue/messages',
  CHANNEL_MESSAGES: (channelId: string) => `/topic/channels/${channelId}`,
  READ_RECEIPTS: '/user/queue/read-receipts',
};

export class MessageModule {
  constructor(
    private httpClient: HttpClient,
    private wsClient: WebSocketClient,
    private eventEmitter: EventEmitter,
  ) {}

  /**
   * 메시지 전송
   */
  async send(channelId: string, params: SendMessageParams): Promise<Message> {
    const response = await this.httpClient.post<Message>(
      API_ENDPOINTS.MESSAGES(channelId),
      {
        type: params.type ?? 'TEXT',
        content: params.content,
        encryptedContent: params.encryptedContent,
        replyTo: params.replyTo,
        metadata: params.metadata,
      },
    );

    return response;
  }

  /**
   * 메시지 목록 조회
   */
  async list(
    channelId: string,
    params?: ListMessagesParams,
  ): Promise<PaginatedResponse<Message>> {
    const response = await this.httpClient.get<PaginatedResponse<Message>>(
      API_ENDPOINTS.MESSAGES(channelId),
      {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        before: params?.before,
        after: params?.after,
      },
    );

    return response;
  }

  /**
   * 단일 메시지 조회
   */
  async get(channelId: string, messageId: string): Promise<Message> {
    const response = await this.httpClient.get<Message>(
      API_ENDPOINTS.MESSAGE(channelId, messageId),
    );

    return response;
  }

  /**
   * 메시지 수정
   */
  async edit(
    channelId: string,
    messageId: string,
    content: string,
  ): Promise<Message> {
    const response = await this.httpClient.put<Message>(
      API_ENDPOINTS.MESSAGE(channelId, messageId),
      {content},
    );

    this.eventEmitter.emit('message.updated', {channelId, message: response});
    return response;
  }

  /**
   * 메시지 삭제
   */
  async delete(channelId: string, messageId: string): Promise<void> {
    await this.httpClient.delete(API_ENDPOINTS.MESSAGE(channelId, messageId));
    this.eventEmitter.emit('message.deleted', {channelId, messageId});
  }

  /**
   * 메시지 읽음 표시
   */
  async markAsRead(channelId: string, messageId: string): Promise<void> {
    await this.httpClient.post(API_ENDPOINTS.READ(channelId, messageId));
  }

  // ===== WebSocket 기반 실시간 기능 =====

  /**
   * 개인 메시지 큐 구독 (모든 채널의 새 메시지)
   */
  subscribeToUserMessages(callback: (message: Message) => void): UnsubscribeFunction {
    return this.wsClient.subscribe<Message>(WS_DESTINATIONS.USER_MESSAGES, message => {
      this.eventEmitter.emit('message.new', {
        channelId: message.channelId,
        message,
      });
      callback(message);
    });
  }

  /**
   * 특정 채널 메시지 구독
   */
  subscribeToChannel(
    channelId: string,
    callback: (message: Message) => void,
  ): UnsubscribeFunction {
    return this.wsClient.subscribe<Message>(
      WS_DESTINATIONS.CHANNEL_MESSAGES(channelId),
      message => {
        this.eventEmitter.emit('message.new', {channelId, message});
        callback(message);
      },
    );
  }

  /**
   * 읽음 표시 구독
   */
  subscribeToReadReceipts(callback: (receipt: ReadReceipt) => void): UnsubscribeFunction {
    return this.wsClient.subscribe<ReadReceipt>(WS_DESTINATIONS.READ_RECEIPTS, receipt => {
      this.eventEmitter.emit('read.receipt', receipt);
      callback(receipt);
    });
  }

  // ===== 이벤트 리스너 =====

  /**
   * 새 메시지 이벤트 구독
   */
  onMessage(
    callback: (data: {channelId: string; message: Message}) => void,
  ): UnsubscribeFunction {
    return this.eventEmitter.on('message.new', callback);
  }

  /**
   * 메시지 수정 이벤트 구독
   */
  onMessageUpdated(
    callback: (data: {channelId: string; message: Message}) => void,
  ): UnsubscribeFunction {
    return this.eventEmitter.on('message.updated', callback);
  }

  /**
   * 메시지 삭제 이벤트 구독
   */
  onMessageDeleted(
    callback: (data: {channelId: string; messageId: string}) => void,
  ): UnsubscribeFunction {
    return this.eventEmitter.on('message.deleted', callback);
  }

  /**
   * 읽음 표시 이벤트 구독
   */
  onReadReceipt(
    callback: (data: {channelId: string; messageId: string; userId: string}) => void,
  ): UnsubscribeFunction {
    return this.eventEmitter.on('read.receipt', callback);
  }
}