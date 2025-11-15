# React Native Chat SDK - 개발 로드맵

> **목표**: 레즈비언 소개팅 앱을 위한 재사용 가능한 Chat SDK 개발
> 
> **현재 상태**: Phase 1 MVP 개발 중 (Backend Spring Boot + Frontend React Native)

---

## 📋 목차

1. [전체 아키텍처 개요](#1-전체-아키텍처-개요)
2. [SDK 개발 단계](#2-sdk-개발-단계)
3. [Phase 1: Core SDK 구조 (현재)](#phase-1-core-sdk-구조)
4. [Phase 2: 실시간 기능](#phase-2-실시간-기능)
5. [Phase 3: E2E 암호화](#phase-3-e2e-암호화)
6. [Phase 4: 고급 기능](#phase-4-고급-기능)
7. [Phase 5: 최적화 & 배포](#phase-5-최적화--배포)
8. [개발 전략 & 도구](#개발-전략--도구)

---

## 1. 전체 아키텍처 개요

### 1.1 시스템 구조

```
┌──────────────────────────────────────────────────────────┐
│                    Host App (소개팅 앱)                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │ - User Authentication (JWT)                        │  │
│  │ - User Profiles                                    │  │
│  │ - Matching Logic                                   │  │
│  │ - Payment/Subscription                             │  │
│  │ - Push Notification Setup                          │  │
│  └────────────────┬───────────────────────────────────┘  │
│                   │                                       │
│                   │ accessToken + refreshToken            │
│                   ↓                                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Chat SDK (우리가 만들 것)                │  │
│  │ ┌────────────────────────────────────────────────┐ │  │
│  │ │ 1. Connection Layer (WebSocket/REST)           │ │  │
│  │ │ 2. Auth Manager (Token Management)             │ │  │
│  │ │ 3. Channel Manager                             │ │  │
│  │ │ 4. Message Manager                             │ │  │
│  │ │ 5. Crypto Manager (E2E Encryption)             │ │  │
│  │ │ 6. Cache Manager (Local Storage)               │ │  │
│  │ │ 7. Notification Handler                        │ │  │
│  │ │ 8. Event System                                │ │  │
│  │ └────────────────────────────────────────────────┘ │  │
│  └────────────────┬───────────────────────────────────┘  │
│                   │                                       │
└───────────────────┼───────────────────────────────────────┘
                    │
                    │ HTTP/WebSocket
                    ↓
┌──────────────────────────────────────────────────────────┐
│              Backend (Spring Boot)                        │
│  - Chat API (REST)                                       │
│  - WebSocket/STOMP                                       │
│  - Encryption Key Server                                 │
│  - File Storage (S3)                                     │
│  - Database (PostgreSQL + MongoDB)                       │
│  - Redis (Cache + Pub/Sub)                               │
└──────────────────────────────────────────────────────────┘
```

### 1.2 SDK의 핵심 책임

**Host App의 책임**
- ✅ 회원가입/로그인
- ✅ 사용자 프로필 관리
- ✅ 매칭 로직
- ✅ 결제/구독
- ✅ 푸시 알림 권한 요청

**SDK의 책임**
- ✅ 채팅 채널 관리
- ✅ 메시지 송수신
- ✅ E2E 암호화/복호화
- ✅ 실시간 기능 (타이핑, 읽음, 온라인 상태)
- ✅ 파일 업로드/다운로드
- ✅ 로컬 캐싱
- ✅ 네트워크 재연결

---

## 2. SDK 개발 단계

### 전체 타임라인 (예상)

| Phase | 기간 | 목표 |
|-------|------|------|
| Phase 1 | 2-3주 | Core SDK 구조 + REST API 연동 |
| Phase 2 | 2-3주 | WebSocket 실시간 기능 |
| Phase 3 | 3-4주 | E2E 암호화 (Signal Protocol) |
| Phase 4 | 2주 | 고급 기능 (파일, 알림, 캐싱) |
| Phase 5 | 1-2주 | 최적화 & 배포 준비 |

---

## Phase 1: Core SDK 구조

### 목표
SDK의 기본 골격을 만들고, REST API를 통한 기본 채팅 기능 구현

### 1.1 프로젝트 초기 설정

#### 디렉토리 구조
```
@yourcompany/chat-sdk/
├── src/
│   ├── index.ts                    # SDK Entry Point
│   ├── ChatSDK.ts                  # Main SDK Class
│   ├── config/
│   │   ├── SDKConfig.ts            # 설정 타입 정의
│   │   └── constants.ts            # 상수 정의
│   ├── core/
│   │   ├── HttpClient.ts           # REST API 클라이언트
│   │   ├── AuthManager.ts          # 인증 & 토큰 관리
│   │   ├── EventEmitter.ts         # 이벤트 시스템
│   │   └── ErrorHandler.ts         # 에러 처리
│   ├── modules/
│   │   ├── ChannelModule.ts        # 채널 관리
│   │   ├── MessageModule.ts        # 메시지 관리
│   │   ├── UserModule.ts           # 사용자 정보
│   │   └── index.ts
│   ├── types/
│   │   ├── Channel.ts              # 채널 타입
│   │   ├── Message.ts              # 메시지 타입
│   │   ├── User.ts                 # 사용자 타입
│   │   └── index.ts
│   └── utils/
│       ├── logger.ts               # 로깅 유틸
│       └── validation.ts           # 입력 검증
├── package.json
├── tsconfig.json
└── README.md
```

### 1.2 핵심 클래스 설계

#### A. ChatSDK (Main Entry)

```typescript
// ChatSDK.ts - SDK의 메인 진입점
class ChatSDK {
  private config: SDKConfig;
  private authManager: AuthManager;
  private httpClient: HttpClient;
  private eventEmitter: EventEmitter;
  
  // 모듈들
  public channels: ChannelModule;
  public messages: MessageModule;
  public users: UserModule;
  
  // 초기화
  static async initialize(options: SDKInitOptions): Promise<ChatSDK>
  
  // 연결/해제
  async connect(tokens: ConnectOptions): Promise<void>
  async disconnect(): Promise<void>
  isConnected(): boolean
  getCurrentUserId(): string | null
}
```

**주요 역할**:
- SDK 인스턴스 관리 (Singleton)
- 모듈 초기화 및 의존성 주입
- 전역 설정 관리

**구현 순서**:
1. 기본 초기화 로직
2. 설정 검증
3. 모듈 인스턴스 생성
4. 이벤트 시스템 연결

---

#### B. AuthManager (인증 관리)

```typescript
// core/AuthManager.ts
class AuthManager {
  private accessToken: string | null;
  private refreshToken: string | null;
  private userId: string | null;
  private onTokenExpired?: TokenRefreshCallback;
  private onAuthFailed?: () => void;
  
  // 토큰 설정
  setTokens(accessToken: string, refreshToken?: string): void
  
  // 토큰 검증
  isTokenValid(): boolean
  shouldRefreshToken(): boolean  // 만료 5분 전
  
  // 토큰 갱신
  async refreshAccessToken(): Promise<string>
  
  // 토큰 가져오기
  getAccessToken(): string | null
  getUserId(): string | null
  
  // 토큰 파싱 (JWT)
  private parseJWT(token: string): JWTPayload
}
```

**주요 역할**:
- JWT 토큰 관리
- 자동 토큰 갱신 (만료 5분 전 또는 401 응답 시)
- 토큰 파싱 및 사용자 ID 추출

**구현 순서**:
1. JWT 파싱 로직 (base64 디코딩)
2. 토큰 저장 (in-memory, 보안상 저장소 사용 안함)
3. 토큰 갱신 로직 (Host App 콜백 호출)
4. 401 에러 시 자동 갱신 재시도

---

#### C. HttpClient (REST API)

```typescript
// core/HttpClient.ts
class HttpClient {
  private baseURL: string;
  private authManager: AuthManager;
  private retryConfig: RetryConfig;
  
  // GET 요청
  async get<T>(endpoint: string, params?: object): Promise<T>
  
  // POST 요청
  async post<T>(endpoint: string, data?: object): Promise<T>
  
  // PUT 요청
  async put<T>(endpoint: string, data?: object): Promise<T>
  
  // DELETE 요청
  async delete<T>(endpoint: string): Promise<T>
  
  // 파일 업로드
  async upload<T>(endpoint: string, file: File, onProgress?: ProgressCallback): Promise<T>
  
  // 내부: 요청 래퍼
  private async request<T>(config: RequestConfig): Promise<T>
  
  // 내부: 재시도 로직
  private async retryRequest<T>(config: RequestConfig, attempt: number): Promise<T>
}
```

**주요 역할**:
- Axios 또는 Fetch API 래핑
- 자동 토큰 헤더 추가
- 401 에러 시 토큰 갱신 후 재시도
- 네트워크 에러 재시도 (exponential backoff)
- 파일 업로드 진행률 추적

**구현 순서**:
1. 기본 HTTP 메소드 구현
2. Authorization 헤더 자동 추가
3. 401 에러 핸들링 (토큰 갱신)
4. 재시도 로직 (3번, 지수 백오프)
5. 파일 업로드 (multipart/form-data)

---

#### D. EventEmitter (이벤트 시스템)

```typescript
// core/EventEmitter.ts
class EventEmitter {
  private listeners: Map<string, Set<EventCallback>>;
  
  // 이벤트 구독
  on(event: string, callback: EventCallback): UnsubscribeFunction
  
  // 이벤트 한 번만 수신
  once(event: string, callback: EventCallback): UnsubscribeFunction
  
  // 이벤트 발생
  emit(event: string, data?: any): void
  
  // 모든 리스너 제거
  removeAllListeners(event?: string): void
}
```

**주요 역할**:
- SDK 내부 이벤트 통신
- Host App으로 이벤트 전달
- 메모리 누수 방지 (구독 해제)

**이벤트 종류**:
- `connected` - SDK 연결됨
- `disconnected` - SDK 연결 해제됨
- `reconnecting` - 재연결 중
- `error` - 에러 발생
- `message.new` - 새 메시지 수신
- `message.updated` - 메시지 수정
- `message.deleted` - 메시지 삭제
- `channel.updated` - 채널 변경
- `typing.start` - 타이핑 시작
- `typing.stop` - 타이핑 종료

---

### 1.3 모듈 구현

#### A. ChannelModule

```typescript
// modules/ChannelModule.ts
class ChannelModule {
  private httpClient: HttpClient;
  private eventEmitter: EventEmitter;
  
  // 채널 생성
  async create(params: CreateChannelParams): Promise<Channel>
  
  // 채널 목록
  async list(params?: ListChannelsParams): Promise<PaginatedResponse<Channel>>
  
  // 채널 상세
  async get(channelId: string): Promise<Channel>
  
  // 채널 나가기
  async leave(channelId: string): Promise<void>
  
  // 채널 삭제 (1:1만 가능)
  async delete(channelId: string): Promise<void>
  
  // 타이핑 시작/종료 (나중에 WebSocket으로 이동)
  async startTyping(channelId: string): Promise<void>
  async stopTyping(channelId: string): Promise<void>
}
```

**API 엔드포인트 매핑**:
- `POST /api/v1/chat/channels` → create()
- `GET /api/v1/chat/channels` → list()
- `GET /api/v1/chat/channels/{id}` → get()
- `DELETE /api/v1/chat/channels/{id}/leave` → leave()
- `DELETE /api/v1/chat/channels/{id}` → delete()

---

#### B. MessageModule

```typescript
// modules/MessageModule.ts
class MessageModule {
  private httpClient: HttpClient;
  private eventEmitter: EventEmitter;
  
  // 메시지 전송
  async send(channelId: string, params: SendMessageParams): Promise<Message>
  
  // 메시지 목록
  async list(channelId: string, params?: ListMessagesParams): Promise<PaginatedResponse<Message>>
  
  // 메시지 수정
  async edit(channelId: string, messageId: string, content: string): Promise<Message>
  
  // 메시지 삭제
  async delete(channelId: string, messageId: string): Promise<void>
  
  // 읽음 표시
  async markAsRead(channelId: string, messageId: string): Promise<void>
  async markChannelAsRead(channelId: string): Promise<void>
  
  // 이미지/파일 전송
  async sendImage(channelId: string, params: SendImageParams): Promise<Message>
  async sendFile(channelId: string, params: SendFileParams): Promise<Message>
  
  // 이벤트 리스너
  onMessage(callback: (message: Message) => void): UnsubscribeFunction
  onMessageUpdated(callback: (message: Message) => void): UnsubscribeFunction
  onMessageDeleted(callback: (messageId: string) => void): UnsubscribeFunction
}
```

**API 엔드포인트 매핑**:
- `POST /api/v1/chat/channels/{id}/messages` → send()
- `GET /api/v1/chat/channels/{id}/messages` → list()
- `PUT /api/v1/chat/channels/{id}/messages/{msgId}` → edit()
- `DELETE /api/v1/chat/channels/{id}/messages/{msgId}` → delete()
- `POST /api/v1/chat/channels/{id}/messages/{msgId}/read` → markAsRead()

---

#### C. UserModule

```typescript
// modules/UserModule.ts
class UserModule {
  private httpClient: HttpClient;
  
  // 사용자 프로필 조회
  async getProfile(userId: string): Promise<UserProfile>
  
  // 온라인 상태 조회 (나중에 WebSocket으로)
  async isOnline(userId: string): Promise<boolean>
  
  // 차단
  async block(userId: string): Promise<void>
  async unblock(userId: string): Promise<void>
  async getBlockedUsers(): Promise<string[]>
}
```

---

### 1.4 타입 정의

#### 핵심 타입들

```typescript
// types/Channel.ts
interface Channel {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string;
  participants: Participant[];
  matchId?: string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// types/Message.ts
interface Message {
  id: string;
  channelId: string;
  senderId: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  content: string;
  encryptedContent?: string;  // E2E 암호화 시
  metadata?: MessageMetadata;
  isEdited: boolean;
  isDeleted: boolean;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

// types/User.ts
interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  isOnline: boolean;
  lastSeenAt?: string;
}
```

---

### 1.5 Phase 1 완료 조건

**기능 체크리스트**:
- [ ] SDK 초기화 및 설정
- [ ] JWT 토큰 관리 (저장, 검증, 갱신)
- [ ] HTTP 클라이언트 (CRUD, 재시도, 파일 업로드)
- [ ] 채널 생성/조회/나가기/삭제
- [ ] 메시지 전송/조회/수정/삭제
- [ ] 읽음 표시
- [ ] 이미지/파일 전송
- [ ] 기본 에러 핸들링
- [ ] 이벤트 시스템 기초

**테스트**:
- [ ] Unit Test (각 모듈별)
- [ ] Integration Test (API 연동)
- [ ] Host App 연동 테스트

---

## Phase 2: 실시간 기능

### 목표
WebSocket/STOMP 연결을 통한 실시간 메시지 송수신 및 부가 기능

### 2.1 WebSocket 클라이언트

#### WebSocketClient 구조

```typescript
// core/WebSocketClient.ts
class WebSocketClient {
  private stompClient: Client;
  private isConnected: boolean;
  private authManager: AuthManager;
  private eventEmitter: EventEmitter;
  private reconnectAttempts: number;
  
  // 연결
  async connect(): Promise<void>
  
  // 연결 해제
  async disconnect(): Promise<void>
  
  // 구독
  subscribe(destination: string, callback: (message: any) => void): Subscription
  
  // 메시지 전송
  send(destination: string, body: any): void
  
  // 재연결
  private async reconnect(): void
  
  // 하트비트
  private setupHeartbeat(): void
}
```

**구현 포인트**:
- STOMP.js 또는 React Native용 WebSocket 라이브러리 사용
- 자동 재연결 (exponential backoff)
- 하트비트 (ping/pong)
- 토큰 기반 인증 (`Authorization: Bearer {token}`)

---

### 2.2 실시간 메시지 수신

#### 구독 경로
- `/user/queue/messages` - 개인 메시지 큐
- `/topic/channels/{channelId}` - 채널별 메시지
- `/user/queue/notifications` - 알림
- `/topic/presence` - 온라인 상태 변경

#### MessageModule 확장

```typescript
class MessageModule {
  private wsClient: WebSocketClient;
  
  // WebSocket으로 메시지 전송
  async sendViaWebSocket(channelId: string, params: SendMessageParams): Promise<void> {
    this.wsClient.send('/app/chat.sendMessage', {
      channelId,
      content: params.content,
      type: params.type,
    });
  }
  
  // 실시간 메시지 수신
  private setupMessageListener(): void {
    this.wsClient.subscribe('/user/queue/messages', (frame) => {
      const message = JSON.parse(frame.body);
      this.eventEmitter.emit('message.new', message);
    });
  }
}
```

---

### 2.3 타이핑 인디케이터

```typescript
// modules/ChannelModule.ts 확장
class ChannelModule {
  // WebSocket으로 타이핑 전송
  async startTyping(channelId: string): Promise<void> {
    this.wsClient.send('/app/chat.typing', {
      channelId,
      action: 'START',
    });
  }
  
  async stopTyping(channelId: string): Promise<void> {
    this.wsClient.send('/app/chat.typing', {
      channelId,
      action: 'STOP',
    });
  }
  
  // 타이핑 상태 수신
  onTyping(channelId: string, callback: (userIds: string[]) => void): UnsubscribeFunction {
    return this.wsClient.subscribe(`/topic/channels/${channelId}/typing`, (frame) => {
      const typingUsers = JSON.parse(frame.body);
      callback(typingUsers);
    });
  }
}
```

**UI 연동 팁**:
- 타이핑 시작 후 3초간 입력 없으면 자동 종료
- Debounce 적용 (너무 자주 전송 방지)

---

### 2.4 온라인 상태 (Presence)

```typescript
// modules/UserModule.ts 확장
class UserModule {
  // 온라인 상태 변경 리스너
  onPresence(userId: string, callback: (presence: UserPresence) => void): UnsubscribeFunction {
    return this.wsClient.subscribe(`/user/${userId}/presence`, (frame) => {
      const presence = JSON.parse(frame.body);
      callback(presence);
    });
  }
  
  // 내 상태 업데이트
  async updatePresence(status: 'ONLINE' | 'AWAY' | 'OFFLINE'): Promise<void> {
    this.wsClient.send('/app/presence.update', { status });
  }
}
```

---

### 2.5 Phase 2 완료 조건

**기능 체크리스트**:
- [ ] WebSocket/STOMP 연결
- [ ] 자동 재연결 (네트워크 끊김 시)
- [ ] 실시간 메시지 송수신
- [ ] 타이핑 인디케이터
- [ ] 온라인 상태 (Presence)
- [ ] 읽음 상태 실시간 업데이트
- [ ] 하트비트 (연결 유지)

**테스트**:
- [ ] WebSocket 연결/해제
- [ ] 재연결 로직
- [ ] 메시지 순서 보장
- [ ] 네트워크 전환 시나리오 (WiFi ↔ 모바일)

---

## Phase 3: E2E 암호화

### 목표
Signal Protocol을 이용한 종단간 암호화 구현

### 3.1 CryptoModule 설계

```typescript
// modules/CryptoModule.ts
class CryptoModule {
  private signalStore: SignalProtocolStore;
  private keyExchangeManager: KeyExchangeManager;
  private httpClient: HttpClient;
  
  // 초기화 (Identity Key, Signed PreKey, OneTime PreKeys 생성)
  async initialize(): Promise<void>
  
  // 키 상태 확인
  async getKeyStatus(): Promise<KeyStatus>
  
  // 키 재생성
  async regenerateKeys(): Promise<void>
  
  // 세션 생성 (상대방과)
  async createSession(peerUserId: string): Promise<void>
  
  // 메시지 암호화
  async encryptMessage(recipientId: string, plaintext: string): Promise<string>
  
  // 메시지 복호화
  async decryptMessage(senderId: string, ciphertext: string): Promise<string>
  
  // 세션 삭제
  async deleteSession(userId: string): Promise<void>
}
```

---

### 3.2 Signal Protocol Store 구현

React Native에서는 `@react-native-async-storage/async-storage` 사용

```typescript
// crypto/SignalProtocolStore.ts
class SignalProtocolStore implements Store {
  // Identity Key
  async getIdentityKeyPair(): Promise<KeyPair>
  async saveIdentity(identifier: string, identityKey: ArrayBuffer): Promise<boolean>
  
  // PreKeys
  async loadPreKey(keyId: number): Promise<KeyPair>
  async storePreKey(keyId: number, keyPair: KeyPair): Promise<void>
  async removePreKey(keyId: number): Promise<void>
  
  // Signed PreKey
  async loadSignedPreKey(keyId: number): Promise<KeyPair>
  async storeSignedPreKey(keyId: number, keyPair: KeyPair): Promise<void>
  
  // Session
  async loadSession(identifier: string): Promise<SessionRecord>
  async storeSession(identifier: string, record: SessionRecord): Promise<void>
  async removeSession(identifier: string): Promise<void>
}
```

---

### 3.3 암호화 Flow

#### 최초 세션 생성

```typescript
// 1. 내 키 생성 및 서버 업로드
await chatSDK.crypto.initialize();
// → POST /api/v1/encryption/keys/generate

// 2. 상대방 키 가져오기
const peerKeys = await httpClient.get(`/api/v1/encryption/keys/${peerUserId}`);

// 3. Signal Protocol로 세션 생성
await chatSDK.crypto.createSession(peerUserId);
```

#### 메시지 암호화/복호화

```typescript
// 메시지 전송 시
const plaintext = "안녕하세요!";
const encryptedContent = await chatSDK.crypto.encryptMessage(recipientId, plaintext);

await chatSDK.messages.send(channelId, {
  type: 'TEXT',
  content: '[암호화됨]',  // 서버에 저장되는 플레이스홀더
  encryptedContent,      // 실제 암호화된 내용
});

// 메시지 수신 시
const decryptedContent = await chatSDK.crypto.decryptMessage(senderId, message.encryptedContent);
```

---

### 3.4 MessageModule 통합

```typescript
class MessageModule {
  private crypto: CryptoModule;
  
  async send(channelId: string, params: SendMessageParams): Promise<Message> {
    // E2E 암호화 활성화 시
    if (this.config.enableE2EEncryption && params.type === 'TEXT') {
      const recipientId = await this.getRecipientId(channelId);
      const encryptedContent = await this.crypto.encryptMessage(recipientId, params.content);
      
      return this.httpClient.post(`/chat/channels/${channelId}/messages`, {
        type: params.type,
        content: '[E2E 암호화]',
        encryptedContent,
      });
    }
    
    // 암호화 없이 전송
    return this.httpClient.post(`/chat/channels/${channelId}/messages`, params);
  }
  
  // 메시지 수신 시 자동 복호화
  onMessage(callback: (message: Message) => void): UnsubscribeFunction {
    return this.eventEmitter.on('message.new', async (message) => {
      if (message.encryptedContent) {
        const decryptedContent = await this.crypto.decryptMessage(
          message.senderId,
          message.encryptedContent
        );
        message.content = decryptedContent;
      }
      
      callback(message);
    });
  }
}
```

---

### 3.5 Phase 3 완료 조건

**기능 체크리스트**:
- [ ] Signal Protocol Store 구현 (AsyncStorage 기반)
- [ ] Identity Key, PreKeys 생성
- [ ] 키 서버 업로드/다운로드
- [ ] Signal Protocol 세션 생성
- [ ] 메시지 암호화/복호화
- [ ] Double Ratchet 지원
- [ ] Forward Secrecy 보장

**테스트**:
- [ ] 키 생성 및 저장
- [ ] 세션 생성
- [ ] 메시지 암복호화
- [ ] 여러 기기 간 세션 관리
- [ ] 키 로테이션

---

## Phase 4: 고급 기능

### 목표
파일 처리, 알림, 캐싱, 오프라인 지원

### 4.1 파일 업로드/다운로드

```typescript
// modules/FileModule.ts
class FileModule {
  // 이미지 업로드 (WebP 변환 + BlurHash)
  async uploadImage(params: UploadImageParams): Promise<UploadedImage> {
    // 1. 이미지 리사이즈 (여러 해상도)
    const resized = await this.resizeImage(params.uri, [800, 400, 200]);
    
    // 2. WebP 변환
    const webpImages = await Promise.all(
      resized.map(img => this.convertToWebP(img))
    );
    
    // 3. BlurHash 생성
    const blurhash = await this.generateBlurHash(params.uri);
    
    // 4. S3 업로드
    const urls = await Promise.all(
      webpImages.map(img => this.httpClient.upload('/files/upload', img))
    );
    
    return {
      urls,
      blurhash,
      width: params.width,
      height: params.height,
    };
  }
  
  // 파일 다운로드 (진행률)
  async downloadFile(url: string, onProgress: (percent: number) => void): Promise<string> {
    // React Native FileSystem 사용
  }
}
```

---

### 4.2 알림 (Notification)

#### NotificationModule

```typescript
// modules/NotificationModule.ts
class NotificationModule {
  private fcmToken: string | null;
  
  // FCM 토큰 등록
  async registerPushToken(token: string): Promise<void> {
    this.fcmToken = token;
    await this.httpClient.post('/notifications/register', { token });
  }
  
  // 푸시 알림 핸들러 (Host App에서 호출)
  async handleNotification(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    const { data } = remoteMessage;
    
    // Silent Push: 클라이언트에서 복호화
    if (data.type === 'SILENT_PUSH') {
      const decryptedContent = await this.crypto.decryptMessage(
        data.senderId,
        data.encryptedContent
      );
      
      // 로컬 알림 표시
      await this.showLocalNotification({
        title: data.senderName,
        body: decryptedContent,
        channelId: data.channelId,
      });
    }
  }
  
  // 로컬 알림 표시
  private async showLocalNotification(params: LocalNotificationParams): Promise<void> {
    // React Native Push Notification 사용
  }
}
```

**Silent Push 장점**:
- E2E 암호화 유지 (서버는 내용 모름)
- 메시지 미리보기 제공 가능

---

### 4.3 캐싱 (Local Storage)

```typescript
// modules/CacheModule.ts
class CacheModule {
  private storage: AsyncStorage;
  private inMemoryCache: Map<string, any>;
  
  // 채널 캐싱
  async cacheChannels(channels: Channel[]): Promise<void>
  async getCachedChannels(): Promise<Channel[]>
  
  // 메시지 캐싱
  async cacheMessages(channelId: string, messages: Message[]): Promise<void>
  async getCachedMessages(channelId: string, limit: number): Promise<Message[]>
  
  // 사용자 프로필 캐싱
  async cacheUserProfile(userId: string, profile: UserProfile): Promise<void>
  async getCachedUserProfile(userId: string): Promise<UserProfile | null>
  
  // 캐시 무효화
  async invalidateCache(keys?: string[]): Promise<void>
  
  // 캐시 크기 제한
  async cleanupOldCache(): Promise<void>
}
```

**캐싱 전략**:
- **채널 목록**: 앱 시작 시 로드, 주기적 업데이트
- **메시지**: 최근 100개 메시지 캐싱
- **프로필**: 30분 TTL
- **이미지**: OS 캐시 활용 (react-native-fast-image)

---

### 4.4 오프라인 지원

```typescript
// modules/OfflineModule.ts
class OfflineModule {
  private pendingQueue: PendingMessage[];
  
  // 오프라인 상태에서 메시지 전송 시 큐에 저장
  async queueMessage(message: PendingMessage): Promise<void> {
    this.pendingQueue.push(message);
    await this.savePendingQueue();
  }
  
  // 온라인 복귀 시 큐 전송
  async flushPendingQueue(): Promise<void> {
    for (const message of this.pendingQueue) {
      try {
        await this.messages.send(message.channelId, message.params);
        this.pendingQueue = this.pendingQueue.filter(m => m.id !== message.id);
      } catch (error) {
        console.error('Failed to send pending message:', error);
      }
    }
    
    await this.savePendingQueue();
  }
}
```

---

### 4.5 Phase 4 완료 조건

**기능 체크리스트**:
- [ ] 이미지 업로드 (WebP, 다중 해상도, BlurHash)
- [ ] 파일 업로드/다운로드 (진행률)
- [ ] 푸시 알림 (FCM 연동)
- [ ] Silent Push 복호화
- [ ] 로컬 캐싱 (채널, 메시지, 프로필)
- [ ] 오프라인 메시지 큐
- [ ] 네트워크 상태 감지

**테스트**:
- [ ] 이미지 압축 및 업로드
- [ ] 대용량 파일 다운로드
- [ ] 오프라인 → 온라인 전환 시 메시지 전송
- [ ] 캐시 히트율

---

## Phase 5: 최적화 & 배포

### 목표
성능 최적화, 문서화, 배포 준비

### 5.1 성능 최적화

#### A. 메모리 관리
- WebSocket 리스너 정리 (unmount 시)
- 이미지 캐시 크기 제한
- 메시지 가상화 (FlatList)

#### B. 네트워크 최적화
- 메시지 페이지네이션 (무한 스크롤)
- Debounce (타이핑 인디케이터)
- HTTP/2 활용 (Keep-Alive)

#### C. 배터리 최적화
- WebSocket 하트비트 간격 조정
- 백그라운드에서 연결 최소화

---

### 5.2 에러 핸들링 & 로깅

```typescript
// core/ErrorHandler.ts
class ErrorHandler {
  // 에러 분류
  handleError(error: Error): void {
    if (error instanceof NetworkError) {
      // 네트워크 에러 → 재시도
    } else if (error instanceof AuthenticationError) {
      // 인증 에러 → 로그아웃
    } else if (error instanceof ValidationError) {
      // 입력 검증 에러 → 사용자 알림
    }
  }
  
  // 로그 전송 (선택적)
  async sendErrorLog(error: Error): Promise<void> {
    // Sentry, Firebase Crashlytics 등
  }
}
```

---

### 5.3 문서화

#### API 문서
- TypeDoc 생성
- README.md (설치, 초기화, 예제)
- CHANGELOG.md

#### 예제 앱
- 기본 채팅 앱 (React Native)
- 소개팅 앱 통합 예제

---

### 5.4 배포

#### NPM 패키지 발행
```bash
npm publish --access public
```

#### Peer Dependencies
```json
{
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-native": ">=0.72.0"
  }
}
```

---

### 5.5 Phase 5 완료 조건

**기능 체크리스트**:
- [ ] 성능 프로파일링
- [ ] 메모리 누수 체크
- [ ] 에러 모니터링 연동
- [ ] API 문서 생성
- [ ] 예제 앱
- [ ] NPM 배포

**테스트**:
- [ ] E2E 테스트 (Detox)
- [ ] 부하 테스트
- [ ] 다양한 기기 테스트

---

## 개발 전략 & 도구

### 멀티 에이전트 AI 개발

#### Claude Desktop (프로젝트 관리)
- 전체 아키텍처 설계
- API 설계 검토
- 복잡한 로직 설계
- Context Files:
  - `react-native-sdk-api-design-v2.md`
  - `database-schema.md`
  - `today-tasks.md`

#### ChatGPT (라이브러리 & 문법)
- 최신 라이브러리 정보
- TypeScript 문법
- React Native 특정 API
- 빠른 코드 스니펫

#### Cursor AI (코딩 구현)
- 실제 코드 작성
- 리팩토링
- 테스트 코드 작성
- `.cursorrules` 적용

---

### 개발 도구

| 도구 | 용도 |
|------|------|
| TypeScript | 타입 안전성 |
| React Native | 크로스 플랫폼 |
| STOMP.js | WebSocket |
| @signalapp/libsignal-client | E2E 암호화 |
| AsyncStorage | 로컬 저장소 |
| Axios | HTTP 클라이언트 |
| Jest | 단위 테스트 |
| Detox | E2E 테스트 |

---

## 마무리

이 로드맵을 따라가면 **재사용 가능한 Chat SDK**를 체계적으로 개발할 수 있습니다.

**핵심 원칙**:
1. **모듈화**: 각 기능을 독립적인 모듈로 분리
2. **점진적 개발**: Phase별로 완료하고 테스트
3. **문서화**: 코드와 함께 문서 작성
4. **테스트**: 각 Phase마다 충분한 테스트

**다음 단계**:
Phase 1부터 시작하여 단계적으로 구현해나가세요. 각 Phase는 독립적으로 완료 가능하며, 필요에 따라 순서를 조정할 수 있습니다.

질문이 있거나 특정 Phase에 대한 상세 설계가 필요하면 언제든 물어보세요! 🚀
