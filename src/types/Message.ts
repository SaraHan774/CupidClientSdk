/**
 * Message - 메시지 타입 정의
 */

import type {User} from './User';

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  sender?: User;
  type: MessageType;
  content: string;
  encryptedContent?: string;
  status?: MessageStatus;
  metadata?: MessageMetadata;
  replyTo?: string;
  replyToMessage?: Message;
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  readBy?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface MessageMetadata {
  // Image metadata
  imageUrl?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  blurhash?: string;

  // File metadata
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  fileUrl?: string;

  // Custom metadata
  [key: string]: unknown;
}

export interface SendMessageParams {
  type?: MessageType;
  content: string;
  encryptedContent?: string;
  replyTo?: string;
  metadata?: MessageMetadata;
}

export interface ListMessagesParams {
  page?: number;
  size?: number;
  before?: string;
  after?: string;
}

export interface ReadReceipt {
  messageId: string;
  channelId: string;
  userId: string;
  readAt: Date;
}

export interface TypingEvent {
  channelId: string;
  userId: string;
  isTyping: boolean;
}