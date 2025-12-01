/**
 * User - 사용자 타입 정의
 */

export interface User {
  id: string;
  username: string;
  nickname?: string;
  profileImageUrl?: string;
  status?: UserStatus;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export type UserStatus = 'online' | 'offline' | 'away' | 'busy';

export interface UserProfile extends User {
  email?: string;
  bio?: string;
  metadata?: Record<string, unknown>;
}

export interface PresenceInfo {
  userId: string;
  status: UserStatus;
  lastSeenAt: Date;
}