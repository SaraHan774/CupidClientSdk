/**
 * UserModule - 사용자 정보
 * 사용자 프로필 조회 및 온라인 상태 등을 처리합니다.
 */

import type {HttpClient} from '../core/HttpClient';
import type {User, UserProfile, PresenceInfo} from '../types';

const API_ENDPOINTS = {
  USERS: '/api/v1/users',
  USER: (id: string) => `/api/v1/users/${id}`,
  ME: '/api/v1/users/me',
  PRESENCE: (id: string) => `/api/v1/users/${id}/presence`,
};

export class UserModule {
  constructor(private httpClient: HttpClient) {}

  /**
   * 현재 사용자 정보 조회
   */
  async getMe(): Promise<UserProfile> {
    const response = await this.httpClient.get<UserProfile>(API_ENDPOINTS.ME);
    return response;
  }

  /**
   * 사용자 정보 조회
   */
  async get(userId: string): Promise<User> {
    const response = await this.httpClient.get<User>(API_ENDPOINTS.USER(userId));
    return response;
  }

  /**
   * 여러 사용자 정보 조회
   */
  async getMany(userIds: string[]): Promise<User[]> {
    const response = await this.httpClient.get<User[]>(API_ENDPOINTS.USERS, {
      ids: userIds.join(','),
    });
    return response;
  }

  /**
   * 프로필 업데이트
   */
  async updateProfile(params: Partial<UserProfile>): Promise<UserProfile> {
    const response = await this.httpClient.put<UserProfile>(API_ENDPOINTS.ME, params);
    return response;
  }

  /**
   * 온라인 상태 조회
   */
  async getPresence(userId: string): Promise<PresenceInfo> {
    const response = await this.httpClient.get<PresenceInfo>(
      API_ENDPOINTS.PRESENCE(userId),
    );
    return response;
  }

  /**
   * 여러 사용자 온라인 상태 조회
   */
  async getPresenceMany(userIds: string[]): Promise<PresenceInfo[]> {
    const response = await this.httpClient.get<PresenceInfo[]>(
      `${API_ENDPOINTS.USERS}/presence`,
      {
        ids: userIds.join(','),
      },
    );
    return response;
  }
}
