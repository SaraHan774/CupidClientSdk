/**
 * HttpClient - REST API 클라이언트
 * HTTP 요청을 처리하는 클라이언트입니다.
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import type {SDKConfig} from '../config/SDKConfig';
import type {AuthManager} from './AuthManager';
import type {ApiError} from '../types';

export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
}

export class HttpClient {
  private axios: AxiosInstance;
  private authManager: AuthManager;
  private debug: boolean;

  constructor(config: SDKConfig, authManager: AuthManager) {
    this.authManager = authManager;
    this.debug = config.debug ?? false;

    this.axios = axios.create({
      baseURL: config.serverUrl,
      timeout: config.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request 인터셉터: 토큰 자동 추가
    this.axios.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.authManager.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (this.debug) {
          console.log(`[HttpClient] ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      error => Promise.reject(error),
    );

    // Response 인터셉터: 401 시 토큰 갱신
    this.axios.interceptors.response.use(
      response => {
        if (this.debug) {
          console.log(`[HttpClient] Response ${response.status}:`, response.data);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // 401 에러 & 재시도 안 한 경우 토큰 갱신 시도
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.authManager.refreshAccessToken();
            const newToken = this.authManager.getAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.axios.request(originalRequest);
          } catch (refreshError) {
            console.error('[HttpClient] Token refresh failed:', refreshError);
            throw this.createApiError(error);
          }
        }

        throw this.createApiError(error);
      },
    );
  }

  private createApiError(error: AxiosError): ApiError {
    const response = error.response?.data as Record<string, unknown> | undefined;

    return {
      code: (response?.code as string) ?? error.code ?? 'UNKNOWN_ERROR',
      message:
        (response?.message as string) ?? error.message ?? 'An unknown error occurred',
      details: response,
      timestamp: new Date(),
    };
  }

  /**
   * GET 요청
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.axios.get<T>(endpoint, {
      params,
      ...config,
    });
    return response.data;
  }

  /**
   * POST 요청
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.axios.post<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * PUT 요청
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.axios.put<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * PATCH 요청
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.axios.patch<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * DELETE 요청
   */
  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.delete<T>(endpoint, config);
    return response.data;
  }

  /**
   * 파일 업로드
   */
  async upload<T>(
    endpoint: string,
    formData: FormData,
    onProgress?: (percent: number) => void,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.axios.post<T>(endpoint, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  }

  /**
   * Axios 인스턴스 접근 (고급 사용)
   */
  getAxiosInstance(): AxiosInstance {
    return this.axios;
  }
}
