/**
 * AuthManager - 인증 & 토큰 관리
 * JWT 토큰 관리 및 인증 처리를 담당합니다.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface JWTPayload {
  sub: string; // userId
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
  [key: string]: unknown;
}

interface TokenRefreshCallback {
  (): Promise<{accessToken: string; refreshToken?: string}>;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@chat_sdk:access_token',
  REFRESH_TOKEN: '@chat_sdk:refresh_token',
  USER_ID: '@chat_sdk:user_id',
};

export class AuthManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private userId: string | null = null;
  private tokenRefreshCallback: TokenRefreshCallback | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  /**
   * 토큰 설정
   */
  async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken ?? null;

    // JWT에서 userId 추출
    const payload = this.parseJWT(accessToken);
    if (payload) {
      this.userId = payload.sub;
    }

    // AsyncStorage에 저장 (선택적)
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
      if (this.userId) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, this.userId);
      }
    } catch (error) {
      console.warn('[AuthManager] Failed to save tokens to storage:', error);
    }
  }

  /**
   * Access Token 반환
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Refresh Token 반환
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * 사용자 ID 반환
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * 토큰 유효성 검사
   */
  isTokenValid(): boolean {
    if (!this.accessToken) {
      return false;
    }

    const payload = this.parseJWT(this.accessToken);
    if (!payload) {
      return false;
    }

    // 만료 시간 체크 (5분 여유)
    const now = Date.now() / 1000;
    return payload.exp > now + 300;
  }

  /**
   * 토큰 갱신 필요 여부 확인 (만료 10분 전)
   */
  shouldRefreshToken(): boolean {
    if (!this.accessToken) {
      return false;
    }

    const payload = this.parseJWT(this.accessToken);
    if (!payload) {
      return false;
    }

    const now = Date.now() / 1000;
    const tenMinutes = 600;
    return payload.exp - now < tenMinutes;
  }

  /**
   * 토큰 갱신 콜백 설정
   */
  setTokenRefreshCallback(callback: TokenRefreshCallback): void {
    this.tokenRefreshCallback = callback;
  }

  /**
   * 토큰 갱신 실행
   */
  async refreshAccessToken(): Promise<string> {
    // 이미 갱신 중이면 기존 Promise 반환
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.tokenRefreshCallback) {
      throw new Error('[AuthManager] Token refresh callback is not set');
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    try {
      const result = await this.tokenRefreshCallback!();
      await this.setTokens(result.accessToken, result.refreshToken);
      return result.accessToken;
    } catch (error) {
      console.error('[AuthManager] Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * JWT 파싱
   */
  private parseJWT(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      // Base64 URL decode (React Native compatible)
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '==='.slice(0, (4 - (base64.length % 4)) % 4);
      const decoded = this.base64Decode(padded);

      return JSON.parse(decoded);
    } catch (error) {
      console.error('[AuthManager] Failed to parse JWT:', error);
      return null;
    }
  }

  /**
   * Base64 디코딩 (React Native 호환)
   */
  private base64Decode(str: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';

    let i = 0;
    while (i < str.length) {
      const enc1 = chars.indexOf(str.charAt(i++));
      const enc2 = chars.indexOf(str.charAt(i++));
      const enc3 = chars.indexOf(str.charAt(i++));
      const enc4 = chars.indexOf(str.charAt(i++));

      const chr1 = (enc1 << 2) | (enc2 >> 4);
      const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      const chr3 = ((enc3 & 3) << 6) | enc4;

      output += String.fromCharCode(chr1);
      if (enc3 !== 64) {
        output += String.fromCharCode(chr2);
      }
      if (enc4 !== 64) {
        output += String.fromCharCode(chr3);
      }
    }

    return decodeURIComponent(escape(output));
  }

  /**
   * 저장된 토큰 로드
   */
  async loadStoredTokens(): Promise<boolean> {
    try {
      const [accessToken, refreshToken, userId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
      ]);

      if (accessToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userId = userId;
        return true;
      }

      return false;
    } catch (error) {
      console.warn('[AuthManager] Failed to load stored tokens:', error);
      return false;
    }
  }

  /**
   * 인증 정보 초기화
   */
  async clear(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.userId = null;

    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_ID,
      ]);
    } catch (error) {
      console.warn('[AuthManager] Failed to clear stored tokens:', error);
    }
  }
}