/**
 * Channel - 채널 타입 정의
 */

import type {User} from './User';
import type {Message} from './Message';

export type ChannelType = 'DIRECT' | 'GROUP' | 'MATCH';

export interface Channel {
  id: string;
  type: ChannelType;
  name?: string;
  description?: string;
  coverImageUrl?: string;
  memberCount: number;
  members?: ChannelMember[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  matchId?: string;
  createdAt: Date;
  updatedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface ChannelMember {
  userId: string;
  user?: User;
  role: ChannelMemberRole;
  joinedAt: Date;
  lastReadAt?: Date;
  lastReadMessageId?: string;
}

export type ChannelMemberRole = 'owner' | 'admin' | 'member';

export interface CreateChannelParams {
  type: ChannelType;
  name?: string;
  targetUserIds: string[];
  matchId?: string;
  metadata?: Record<string, unknown>;
}

export interface ListChannelsParams {
  page?: number;
  size?: number;
  type?: ChannelType;
}

export interface UpdateChannelParams {
  name?: string;
  description?: string;
  coverImageUrl?: string;
  metadata?: Record<string, unknown>;
}