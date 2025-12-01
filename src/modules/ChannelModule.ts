/**
 * ChannelModule - 채널 관리
 * 채팅 채널의 생성, 조회, 나가기, 삭제 등을 처리합니다.
 */

import type {HttpClient} from '../core/HttpClient';
import type {WebSocketClient} from '../core/WebSocketClient';
import type {EventEmitter} from '../core/EventEmitter';
import type {
  Channel,
  CreateChannelParams,
  ListChannelsParams,
  UpdateChannelParams,
  PaginatedResponse,
  UnsubscribeFunction,
} from '../types';

const API_ENDPOINTS = {
  CHANNELS: '/api/v1/chat/channels',
  CHANNEL: (id: string) => `/api/v1/chat/channels/${id}`,
  LEAVE: (id: string) => `/api/v1/chat/channels/${id}/leave`,
  MEMBERS: (id: string) => `/api/v1/chat/channels/${id}/members`,
};

const WS_DESTINATIONS = {
  TYPING_START: '/app/typing/start',
  TYPING_STOP: '/app/typing/stop',
  TYPING_TOPIC: (channelId: string) => `/topic/channel.${channelId}.typing`,
};

export class ChannelModule {
  constructor(
    private httpClient: HttpClient,
    private wsClient: WebSocketClient,
    private eventEmitter: EventEmitter,
  ) {}

  /**
   * 채널 생성
   */
  async create(params: CreateChannelParams): Promise<Channel> {
    const response = await this.httpClient.post<Channel>(API_ENDPOINTS.CHANNELS, {
      type: params.type,
      name: params.name,
      targetUserIds: params.targetUserIds,
      matchId: params.matchId,
      metadata: params.metadata,
    });

    this.eventEmitter.emit('channel.created', {channel: response});
    return response;
  }

  /**
   * 채널 목록 조회
   */
  async list(params?: ListChannelsParams): Promise<PaginatedResponse<Channel>> {
    const response = await this.httpClient.get<PaginatedResponse<Channel>>(
      API_ENDPOINTS.CHANNELS,
      {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        type: params?.type,
      },
    );

    return response;
  }

  /**
   * 채널 상세 조회
   */
  async get(channelId: string): Promise<Channel> {
    const response = await this.httpClient.get<Channel>(
      API_ENDPOINTS.CHANNEL(channelId),
    );

    return response;
  }

  /**
   * 채널 정보 수정
   */
  async update(channelId: string, params: UpdateChannelParams): Promise<Channel> {
    const response = await this.httpClient.put<Channel>(
      API_ENDPOINTS.CHANNEL(channelId),
      params,
    );

    this.eventEmitter.emit('channel.updated', {channel: response});
    return response;
  }

  /**
   * 채널 나가기
   */
  async leave(channelId: string): Promise<void> {
    await this.httpClient.delete(API_ENDPOINTS.LEAVE(channelId));
    this.eventEmitter.emit('channel.member.left', {
      channelId,
      userId: 'self', // 실제로는 현재 사용자 ID 사용
    });
  }

  /**
   * 채널 삭제 (관리자 전용)
   */
  async delete(channelId: string): Promise<void> {
    await this.httpClient.delete(API_ENDPOINTS.CHANNEL(channelId));
    this.eventEmitter.emit('channel.deleted', {channelId});
  }

  // ===== WebSocket 기반 실시간 기능 =====

  /**
   * 타이핑 시작 알림
   */
  startTyping(channelId: string): void {
    this.wsClient.send(WS_DESTINATIONS.TYPING_START, {channelId});
  }

  /**
   * 타이핑 종료 알림
   */
  stopTyping(channelId: string): void {
    this.wsClient.send(WS_DESTINATIONS.TYPING_STOP, {channelId});
  }

  /**
   * 타이핑 이벤트 구독
   */
  onTyping(
    channelId: string,
    callback: (data: {userIds: string[]}) => void,
  ): UnsubscribeFunction {
    return this.wsClient.subscribe(WS_DESTINATIONS.TYPING_TOPIC(channelId), callback);
  }

  // ===== 이벤트 리스너 =====

  /**
   * 채널 생성 이벤트 구독
   */
  onChannelCreated(callback: (data: {channel: Channel}) => void): UnsubscribeFunction {
    return this.eventEmitter.on('channel.created', callback);
  }

  /**
   * 채널 업데이트 이벤트 구독
   */
  onChannelUpdated(callback: (data: {channel: Channel}) => void): UnsubscribeFunction {
    return this.eventEmitter.on('channel.updated', callback);
  }

  /**
   * 채널 삭제 이벤트 구독
   */
  onChannelDeleted(callback: (data: {channelId: string}) => void): UnsubscribeFunction {
    return this.eventEmitter.on('channel.deleted', callback);
  }

  /**
   * 멤버 입장 이벤트 구독
   */
  onMemberJoined(
    callback: (data: {channelId: string; userId: string}) => void,
  ): UnsubscribeFunction {
    return this.eventEmitter.on('channel.member.joined', callback);
  }

  /**
   * 멤버 퇴장 이벤트 구독
   */
  onMemberLeft(
    callback: (data: {channelId: string; userId: string}) => void,
  ): UnsubscribeFunction {
    return this.eventEmitter.on('channel.member.left', callback);
  }
}
