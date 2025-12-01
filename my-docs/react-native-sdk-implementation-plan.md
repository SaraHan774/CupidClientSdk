# React Native Chat SDK - 구현 계획표 (백엔드 연동)

> **작성일**: 2025년 1월 19일  
> **목표**: 현재 백엔드 구조(Spring Boot)에 맞춘 React Native SDK 설계 및 구현 로드맵

---

## 📋 목차

1. [백엔드 현황 분석](#1-백엔드-현황-분석)
2. [SDK 아키텍처 전략](#2-sdk-아키텍처-전략)
3. [Phase별 구현 계획](#3-phase별-구현-계획)
4. [상세 구현 일정](#4-상세-구현-일정)
5. [API 매핑 테이블](#5-api-매핑-테이블)
6. [UI 구현 전략](#6-ui-구현-전략)

---

## 1. 백엔드 현황 분석

### 1.1 현재 구현 완료된 기능

| 기능 | 상태 | 엔드포인트 |
|------|------|-----------|
| JWT 인증 | ✅ | `/api/auth/login`, `/api/auth/refresh` |
| WebSocket 연결 | ✅ | `/ws` (STOMP) |
| 메시지 송수신 | ✅ | POST `/api/v1/chat/channels/{id}/messages` |
| 채널 생성/조회 | ✅ | POST/GET `/api/v1/chat/channels` |
| 채널 나가기 | ✅ | DELETE `/api/v1/chat/channels/{id}/leave` |
| FCM 알림 기본 | ✅ | 푸시 알림 전송 |
| Rate Limiting | ✅ | 요청 제한 |

### 1.2 백엔드 우선순위 작업 (SDK와 병렬 개발)

**즉시 필요 (SDK Phase 1과 함께)**:
- [ ] 타이핑 인디케이터 (2시간)
- [ ] 읽음 표시 API (2시간)
- [ ] 매칭 해제 처리 (2-3시간)

**단기 (SDK Phase 2와 함께)**:
- [ ] 메시지 수정/삭제 (3-4시간)
- [ ] 그룹 인원 제한 (1시간)
- [ ] 프로필 이미지 업로드 (4-5시간)

**중기 (SDK Phase 3과 함께)**:
- [ ] E2E 암호화 완전 구현 (7-8시간)
- [ ] 알림 고급 기능 (4-5시간)

---

## 2. SDK 아키텍처 전략

### 2.1 Headless + UI Kit 하이브리드

```
@yourcompany/chat-sdk/
├── /core (Headless Layer)
│   ├── ChatSDK.ts
│   ├── HttpClient.ts
│   ├── WebSocketClient.ts
│   ├── AuthManager.ts
│   ├── EventEmitter.ts
│   └── CryptoManager.ts
│
├── /hooks (React Hooks - Headless)
│   ├── useChatChannel.ts
│   ├── useChatMessages.ts
│   ├── useTypingIndicator.ts
│   ├── useReadReceipts.ts
│   └── useChannelMembers.ts
│
├── /components (UI Kit - Optional)
│   ├── /atomic
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   └── Button.tsx
│   ├── /molecules
│   │   ├── MessageBubble.tsx
│   │   ├── ChannelListItem.tsx
│   │   └── TypingIndicator.tsx
│   └── /organisms
│       ├── MessageList.tsx
│       ├── MessageInput.tsx
│       └── ChannelList.tsx
│
└── /theme
    ├── ThemeProvider.tsx
    ├── defaultTheme.ts
    └── darkTheme.ts
```

### 2.2 백엔드 API와의 매핑

```typescript
// SDK Core → Backend API 매핑

SDK Method                          Backend API
─────────────────────────────────   ─────────────────────────────────────
chatSDK.connect(token)           →  POST /api/auth/login (Host App)
                                    WebSocket /ws (Chat Backend)

chatSDK.channels.create()        →  POST /api/v1/chat/channels
chatSDK.channels.list()          →  GET /api/v1/chat/channels
chatSDK.channels.get(id)         →  GET /api/v1/chat/channels/{id}
chatSDK.channels.leave(id)       →  DELETE /api/v1/chat/channels/{id}/leave

chatSDK.messages.send()          →  POST /api/v1/chat/channels/{id}/messages
chatSDK.messages.list()          →  GET /api/v1/chat/channels/{id}/messages
chatSDK.messages.edit()          →  PUT /api/v1/chat/channels/{id}/messages/{msgId}
chatSDK.messages.delete()        →  DELETE /api/v1/chat/channels/{id}/messages/{msgId}
chatSDK.messages.markAsRead()    →  POST /api/v1/chat/channels/{id}/messages/{msgId}/read

// WebSocket 구독
chatSDK.messages.onMessage()     →  SUBSCRIBE /user/queue/messages
                                    SUBSCRIBE /topic/channels/{id}

chatSDK.channels.startTyping()   →  SEND /app/typing/start
chatSDK.channels.onTyping()      →  SUBSCRIBE /topic/channel.{id}.typing
```

---

## 3. Phase별 구현 계획

### Phase 1: Headless Core (3주) 🔴 현재

**목표**: SDK의 뼈대 구축 + 백엔드 REST API 연동

**완료 조건**:
- HTTP 통신으로 기본 채팅 가능
- WebSocket 실시간 메시지 수신
- 토큰 관리 (저장, 갱신, 검증)

---

### Phase 2: 실시간 기능 (2주)

**목표**: WebSocket 고급 기능 + 실시간 이벤트

**완료 조건**:
- 타이핑 인디케이터
- 읽음 표시
- 온라인 상태
- 자동 재연결

---

### Phase 3: UI Kit 기본 (3주)

**목표**: 기본 UI 컴포넌트 제공

**완료 조건**:
- MessageBubble, ChannelListItem 등
- 기본 테마 (Light/Dark)
- Storybook 문서화

---

### Phase 4: E2E 암호화 (3주)

**목표**: Signal Protocol 통합

**완료 조건**:
- 키 생성 및 교환
- 메시지 암복호화
- Forward Secrecy

---

### Phase 5: 고급 기능 (2주)

**목표**: 파일, 알림, 캐싱

**완료 조건**:
- 이미지/파일 업로드
- 푸시 알림 통합
- 로컬 캐싱

---

### Phase 6: 문서화 & 배포 (1주)

**목표**: NPM 배포 준비

**완료 조건**:
- 예제 앱 3개
- API 문서
- 마이그레이션 가이드

---

## 4. 상세 구현 일정

### 📅 Week 1-3: Phase 1 - Headless Core

#### Week 1: 프로젝트 초기 설정 + Core 클래스

**Day 1-2: 프로젝트 설정**
```bash
# 작업 내용
- [ ] NPM 패키지 초기화
- [ ] TypeScript 설정
- [ ] 디렉토리 구조 생성
- [ ] Git 리포지토리 설정
- [ ] ESLint + Prettier 설정
```

**구현할 파일**:
```
package.json
tsconfig.json
.eslintrc.js
.prettierrc
src/index.ts (Entry Point)
```

**의존성 설치**:
```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "@react-native-async-storage/async-storage": "^1.21.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/react-native": "^0.72.0"
  }
}
```

---

**Day 3-4: AuthManager 구현**

**파일**: `src/core/AuthManager.ts`

```typescript
class AuthManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private userId: string | null = null;
  
  // 구현 메소드
  setTokens(accessToken: string, refreshToken?: string): void
  getAccessToken(): string | null
  isTokenValid(): boolean
  shouldRefreshToken(): boolean
  private parseJWT(token: string): JWTPayload
  async refreshAccessToken(): Promise<string>
}
```

**테스트 작성**:
```typescript
// __tests__/AuthManager.test.ts
describe('AuthManager', () => {
  test('should parse JWT token correctly', () => {
    // JWT 파싱 테스트
  });
  
  test('should detect expired token', () => {
    // 만료 감지 테스트
  });
});
```

**백엔드 연동**:
- 필요 없음 (토큰은 Host App에서 제공)

---

**Day 5: HttpClient 구현**

**파일**: `src/core/HttpClient.ts`

```typescript
class HttpClient {
  private axios: AxiosInstance;
  private authManager: AuthManager;
  
  constructor(config: HttpClientConfig) {
    this.axios = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
    });
    
    // 인터셉터 설정
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request 인터셉터: 토큰 자동 추가
    this.axios.interceptors.request.use((config) => {
      const token = this.authManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    // Response 인터셉터: 401 시 토큰 갱신
    this.axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.authManager.refreshAccessToken();
          // 원래 요청 재시도
          return this.axios.request(error.config);
        }
        throw error;
      }
    );
  }
  
  async get<T>(endpoint: string, params?: any): Promise<T>
  async post<T>(endpoint: string, data?: any): Promise<T>
  async put<T>(endpoint: string, data?: any): Promise<T>
  async delete<T>(endpoint: string): Promise<T>
}
```

**백엔드 연동**:
```typescript
// 테스트 시 실제 백엔드 호출
const client = new HttpClient({ baseURL: 'http://localhost:8080' });
const channels = await client.get('/api/v1/chat/channels');
```

---

#### Week 2: WebSocket + EventEmitter

**Day 1-3: WebSocketClient 구현**

**파일**: `src/core/WebSocketClient.ts`

```typescript
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';

class WebSocketClient {
  private stompClient: StompClient;
  private isConnected: boolean = false;
  private subscriptions: Map<string, any> = new Map();
  
  async connect(token: string): Promise<void> {
    const socket = new SockJS('http://localhost:8080/ws');
    
    this.stompClient = new StompClient({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        this.isConnected = true;
        this.onConnected();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
    });
    
    this.stompClient.activate();
  }
  
  subscribe(destination: string, callback: (message: any) => void) {
    const subscription = this.stompClient.subscribe(destination, (message) => {
      const body = JSON.parse(message.body);
      callback(body);
    });
    
    this.subscriptions.set(destination, subscription);
    return () => subscription.unsubscribe();
  }
  
  send(destination: string, body: any) {
    this.stompClient.publish({
      destination,
      body: JSON.stringify(body),
    });
  }
  
  disconnect() {
    this.stompClient.deactivate();
    this.isConnected = false;
  }
}
```

**백엔드 연동**:
```
WebSocket 엔드포인트: ws://localhost:8080/ws
프로토콜: STOMP over SockJS
인증: Bearer Token in connectHeaders
```

---

**Day 4-5: EventEmitter 구현**

**파일**: `src/core/EventEmitter.ts`

```typescript
type EventCallback = (data?: any) => void;
type UnsubscribeFunction = () => void;

class EventEmittJSON
  private listeners: Map<string, Set<EventCallback>> = new Map();
  
  on(event: string, callback: EventCallback): UnsubscribeFunction {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    // 구독 해제 함수 반환
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }
  
  once(event: string, callback: EventCallback): UnsubscribeFunction {
    const onceCallback = (data?: any) => {
      callback(data);
      unsubscribe();
    };
    
    const unsubscribe = this.on(event, onceCallback);
    return unsubscribe;
  }
  
  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
  
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
```

**사용 예시**:
```typescript
const emitter = new EventEmitter();

// 이벤트 구독
const unsubscribe = emitter.on('message.new', (message) => {
  console.log('New message:', message);
});

// 이벤트 발생
emitter.emit('message.new', { id: '123', content: 'Hello' });

// 구독 해제
unsubscribe();
```

---

#### Week 3: ChatSDK Main + 기본 모듈

**Day 1-2: ChatSDK 메인 클래스**

**파일**: `src/ChatSDK.ts`

```typescript
class ChatSDK {
  private static instance: ChatSDK | null = null;
  
  private config: SDKConfig;
  private authManager: AuthManager;
  private httpClient: HttpClient;
  private wsClient: WebSocketClient;
  private eventEmitter: EventEmitter;
  
  // 모듈
  public channels: ChannelModule;
  public messages: MessageModule;
  public users: UserModule;
  
  private constructor(config: SDKConfig) {
    this.config = config;
    this.authManager = new AuthManager(config);
    this.httpClient = new HttpClient(config, this.authManager);
    this.wsClient = new WebSocketClient(config);
    this.eventEmitter = new EventEmitter();
    
    // 모듈 초기화
    this.channels = new ChannelModule(this.httpClient, this.wsClient, this.eventEmitter);
    this.messages = new MessageModule(this.httpClient, this.wsClient, this.eventEmitter);
    this.users = new UserModule(this.httpClient);
  }
  
  static async initialize(config: SDKConfig): Promise<ChatSDK> {
    if (!ChatSDK.instance) {
      ChatSDK.instance = new ChatSDK(config);
    }
    return ChatSDK.instance;
  }
  
  async connect(options: ConnectOptions): Promise<void> {
    // 1. 토큰 설정
    this.authManager.setTokens(options.accessToken, options.refreshToken);
    
    // 2. WebSocket 연결
    await this.wsClient.connect(options.accessToken);
    
    // 3. 기본 구독 설정
    this.setupDefaultSubscriptions();
    
    this.eventEmitter.emit('connected');
  }
  
  private setupDefaultSubscriptions() {
    // 개인 메시지 큐 구독
    this.wsClient.subscribe('/user/queue/messages', (message) => {
      this.eventEmitter.emit('message.new', message);
    });
  }
  
  async disconnect(): Promise<void> {
    this.wsClient.disconnect();
    this.authManager.clear();
    this.eventEmitter.emit('disconnected');
  }
  
  isConnected(): boolean {
    return this.wsClient.isConnected();
  }
  
  getCurrentUserId(): string | null {
    return this.authManager.getUserId();
  }
}
```

**백엔드 연동 테스트**:
```typescript
// 테스트 코드
const chatSDK = await ChatSDK.initialize({
  serverUrl: 'http://localhost:8080',
});

// Host App에서 로그인 후 토큰 받아오기
const user = await MyAppAuth.login({ username, password });

// SDK 연결
await chatSDK.connect({
  accessToken: user.accessToken,
  refreshToken: user.refreshToken,
});

console.log('Connected:', chatSDK.isConnected()); // true
```

---

**Day 3-5: ChannelModule + MessageModule**

**파일**: `src/modules/ChannelModule.ts`

```typescript
class ChannelModule {
  constructor(
    private httpClient: HttpClient,
    private wsClient: WebSocketClient,
    private eventEmitter: EventEmitter
  ) {}
  
  async create(params: CreateChannelParams): Promise<Channel> {
    const response = await this.httpClient.post<Channel>(
      '/api/v1/chat/channels',
      {
        type: params.type,
        name: params.name,
        targetUserIds: params.targetUserIds,
        matchId: params.matchId,
      }
    );
    
    return response;
  }
  
  async list(params?: ListChannelsParams): Promise<PaginatedResponse<Channel>> {
    const response = await this.httpClient.get<PaginatedResponse<Channel>>(
      '/api/v1/chat/channels',
      {
        page: params?.page || 0,
        size: params?.size || 20,
      }
    );
    
    return response;
  }
  
  async get(channelId: string): Promise<Channel> {
    const response = await this.httpClient.get<Channel>(
      `/api/v1/chat/channels/${channelId}`
    );
    
    return response;
  }
  
  async leave(channelId: string): Promise<void> {
    await this.httpClient.delete(`/api/v1/chat/channels/${channelId}/leave`);
  }
  
  // 타이핑 (WebSocket) - 백엔드 구현 후 활성화
  async startTyping(channelId: string): Promise<void> {
    this.wsClient.send('/app/typing/start', { channelId });
  }
  
  async stopTyping(channelId: string): Promise<void> {
    this.wsClient.send('/app/typing/stop', { channelId });
  }
  
  onTyping(channelId: string, callback: (userIds: string[]) => void) {
    return this.wsClient.subscribe(
      `/topic/channel.${channelId}.typing`,
      callback
    );
  }
}
```

**파일**: `src/modules/MessageModule.ts`

```typescript
class MessageModule {
  constructor(
    private httpClient: HttpClient,
    private wsClient: WebSocketClient,
    private eventEmitter: EventEmitter
  ) {}
  
  async send(channelId: string, params: SendMessageParams): Promise<Message> {
    const response = await this.httpClient.post<Message>(
      `/api/v1/chat/channels/${channelId}/messages`,
      {
        type: params.type,
        content: params.content,
        encryptedContent: params.encryptedContent,
      }
    );
    
    return response;
  }
  
  async list(channelId: string, params?: ListMessagesParams): Promise<PaginatedResponse<Message>> {
    const response = await this.httpClient.get<PaginatedResponse<Message>>(
      `/api/v1/chat/channels/${channelId}/messages`,
      {
        page: params?.page || 0,
        size: params?.size || 20,
      }
    );
    
    return response;
  }
  
  // 메시지 수정 - 백엔드 구현 후 활성화
  async edit(channelId: string, messageId: string, content: string): Promise<Message> {
    const response = await this.httpClient.put<Message>(
      `/api/v1/chat/channels/${channelId}/messages/${messageId}`,
      { content }
    );
    
    return response;
  }
  
  // 메시지 삭제 - 백엔드 구현 후 활성화
  async delete(channelId: string, messageId: string): Promise<void> {
    await this.httpClient.delete(
      `/api/v1/chat/channels/${channelId}/messages/${messageId}`
    );
  }
  
  // 읽음 표시 - 백엔드 구현 후 활성화
  async markAsRead(channelId: string, messageId: string): Promise<void> {
    await this.httpClient.post(
      `/api/v1/chat/channels/${channelId}/messages/${messageId}/read`
    );
  }
  
  // 실시간 메시지 수신
  onMessage(callback: (message: Message) => void) {
    return this.eventEmitter.on('message.new', callback);
  }
  
  onMessageUpdated(callback: (message: Message) => void) {
    return this.eventEmitter.on('message.updated', callback);
  }
  
  onMessageDeleted(callback: (messageId: string) => void) {
    return this.eventEmitter.on('message.deleted', callback);
  }
}
```

**백엔드 연동 테스트**:
```typescript
// 채널 생성
const channel = await chatSDK.channels.create({
  type: 'DIRECT',
  targetUserIds: ['bob-user-id'],
});

// 메시지 전송
const message = await chatSDK.messages.send(channel.id, {
  type: 'TEXT',
  content: '안녕하세요!',
});

// 실시간 메시지 수신
chatSDK.messages.onMessage((message) => {
  console.log('New message:', message);
});
```

---

### 📅 Week 4-5: Phase 2 - Headless Hooks

#### Week 4: React Hooks 구현

**Day 1-2: useChatChannel Hook**

**파일**: `src/hooks/useChatChannel.ts`

```typescript
export function useChatChannel(channelId: string) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const chatSDK = useChatSDK();
  
  useEffect(() => {
    const loadChannel = async () => {
      setLoading(true);
      try {
        const channelData = await chatSDK.channels.get(channelId);
        setChannel(channelData);
        // 멤버 정보도 로드
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    loadChannel();
  }, [channelId]);
  
  return {
    channel,
    members,
    loading,
  };
}
```

---

**Day 3-5: useChatMessages Hook**

**파일**: `src/hooks/useChatMessages.ts`

```typescript
export function useChatMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatSDK = useChatSDK();
  
  // 메시지 로드
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      const msgs = await chatSDK.messages.list(channelId);
      setMessages(msgs.content);
      setLoading(false);
    };
    
    loadMessages();
  }, [channelId]);
  
  // 실시간 메시지 수신
  useEffect(() => {
    const unsubscribe = chatSDK.messages.onMessage((message) => {
      if (message.channelId === channelId) {
        setMessages(prev => [...prev, message]);
      }
    });
    
    return unsubscribe;
  }, [channelId]);
  
  // 메시지 전송
  const sendMessage = useCallback(async (params: SendMessageParams) => {
    const message = await chatSDK.messages.send(channelId, params);
    return message;
  }, [channelId]);
  
  return {
    messages,
    loading,
    sendMessage,
  };
}
```

**사용 예시 (Headless 모드)**:
```typescript
function CustomChatScreen({ channelId }) {
  const { messages, sendMessage } = useChatMessages(channelId);
  
  return (
    <View>
      {messages.map(msg => (
        <Text key={msg.id}>{msg.content}</Text>
      ))}
      <Button onPress={() => sendMessage({ content: 'Hello' })} />
    </View>
  );
}
```

---

#### Week 5: 실시간 기능 Hooks

**Day 1-2: useTypingIndicator Hook**

**파일**: `src/hooks/useTypingIndicator.ts`

```typescript
export function useTypingIndicator(channelId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const chatSDK = useChatSDK();
  
  useEffect(() => {
    const unsubscribe = chatSDK.channels.onTyping(channelId, (userIds) => {
      setTypingUsers(userIds);
    });
    
    return unsubscribe;
  }, [channelId]);
  
  const startTyping = useCallback(() => {
    chatSDK.channels.startTyping(channelId);
  }, [channelId]);
  
  const stopTyping = useCallback(() => {
    chatSDK.channels.stopTyping(channelId);
  }, [channelId]);
  
  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
}
```

**백엔드 연동**:
- 백엔드에서 타이핑 인디케이터 API 구현 필요 (Week 4 Day 1-2 백엔드 작업)
- WebSocket 토픽: `/topic/channel.{channelId}.typing`

---

**Day 3-5: useReadReceipts Hook**

**파일**: `src/hooks/useReadReceipts.ts`

```typescript
export function useReadReceipts(channelId: string) {
  const [readReceipts, setReadReceipts] = useState<Map<string, string[]>>(new Map());
  const chatSDK = useChatSDK();
  
  // 읽음 표시 구독
  useEffect(() => {
    const unsubscribe = chatSDK.wsClient.subscribe(
      `/user/queue/read-receipts`,
      (receipt: ReadReceiptEvent) => {
        if (receipt.channelId === channelId) {
          setReadReceipts(prev => {
            const newMap = new Map(prev);
            const readers = newMap.get(receipt.messageId) || [];
            newMap.set(receipt.messageId, [...readers, receipt.userId]);
            return newMap;
          });
        }
      }
    );
    
    return unsubscribe;
  }, [channelId]);
  
  const markAsRead = useCallback(async (messageId: string) => {
    await chatSDK.messages.markAsRead(channelId, messageId);
  }, [channelId]);
  
  return {
    readReceipts,
    markAsRead,
  };
}
```

**백엔드 연동**:
- 백엔드에서 읽음 표시 API 구현 필요 (Week 4 Day 3-5 백엔드 작업)
- API: `POST /api/v1/chat/channels/{channelId}/messages/{messageId}/read`

---

### 📅 Week 6-8: Phase 3 - UI Kit 구현

#### Week 6: Atomic Components

**Day 1: Avatar 컴포넌트**

**파일**: `src/components/atomic/Avatar.tsx`

```typescript
interface AvatarProps {
  imageUrl?: string;
  size?: 'small' | 'medium' | 'large';
  name?: string;
  theme?: Theme;
}

export function Avatar({ imageUrl, size = 'medium', name, theme }: AvatarProps) {
  const themeContext = useTheme(theme);
  
  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
  };
  
  const dimension = sizeMap[size];
  
  // 이미지 없으면 이니셜 표시
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';
  
  return (
    <View style={[styles.container, { width: dimension, height: dimension }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: themeContext.colors.primary }]}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      )}
    </View>
  );
}
```

---

**Day 2: Badge 컴포넌트**

**파일**: `src/components/atomic/Badge.tsx`

```typescript
interface BadgeProps {
  count: number;
  theme?: Theme;
}

export function Badge({ count, theme }: BadgeProps) {
  const themeContext = useTheme(theme);
  
  if (count === 0) return null;
  
  const displayCount = count > 99 ? '99+' : count.toString();
  
  return (
    <View style={[styles.badge, { backgroundColor: themeContext.colors.error }]}>
      <Text style={styles.count}>{displayCount}</Text>
    </View>
  );
}
```

---

**Day 3-5: MessageBubble 컴포넌트**

**파일**: `src/components/molecules/MessageBubble.tsx`

```typescript
interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showAvatar?: boolean;
  theme?: Theme;
}

export function MessageBubble({ 
  message, 
  isMine, 
  showAvatar = true,
  theme 
}: MessageBubbleProps) {
  const themeContext = useTheme(theme);
  
  const bubbleColor = isMine
    ? themeContext.colors.messageBubble.sent
    : themeContext.colors.messageBubble.received;
  
  const textColor = isMine
    ? themeContext.colors.text.onPrimary
    : themeContext.colors.text.primary;
  
  return (
    <View style={[styles.container, isMine && styles.containerMine]}>
      {showAvatar && !isMine && (
        <Avatar imageUrl={message.sender.profileImageUrl} size="small" />
      )}
      
      <View style={[styles.bubble, { backgroundColor: bubbleColor }]}>
        <Text style={[styles.text, { color: textColor }]}>
          {message.content}
        </Text>
        
        <Text style={styles.timestamp}>
          {formatTime(message.createdAt)}
        </Text>
        
        {message.isEdited && (
          <Text style={styles.edited}>(수정됨)</Text>
        )}
      </View>
    </View>
  );
}
```

---

#### Week 7: Container Components

**Day 1-3: MessageList 컴포넌트**

**파일**: `src/components/organisms/MessageList.tsx`

```typescript
interface MessageListProps {
  channelId: string;
  renderMessage?: (message: Message) => React.ReactNode;
  theme?: Theme;
}

export function MessageList({ 
  channelId, 
  renderMessage,
  theme 
}: MessageListProps) {
  const { messages, loading } = useChatMessages(channelId);
  const { markAsRead } = useReadReceipts(channelId);
  const currentUserId = useChatSDK().getCurrentUserId();
  const themeContext = useTheme(theme);
  
  // 기본 렌더러
  const defaultRenderMessage = (message: Message) => (
    <MessageBubble 
      message={message}
      isMine={message.senderId === currentUserId}
      theme={themeContext}
    />
  );
  
  const renderer = renderMessage || defaultRenderMessage;
  
  // 화면에 보이면 읽음 처리
  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    viewableItems.forEach(({ item }) => {
      if (item.senderId !== currentUserId) {
        markAsRead(item.id);
      }
    });
  }, [currentUserId, markAsRead]);
  
  if (loading) {
    return <ActivityIndicator />;
  }
  
  return (
    <FlatList
      data={messages}
      renderItem={({ item }) => renderer(item)}
      keyExtractor={(item) => item.id}
      inverted
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
    />
  );
}
```

---

**Day 4-5: MessageInput 컴포넌트**

**파일**: `src/components/organisms/MessageInput.tsx`

```typescript
interface MessageInputProps {
  channelId: string;
  onSend?: (message: Message) => void;
  theme?: Theme;
}

export function MessageInput({ channelId, onSend, theme }: MessageInputProps) {
  const [text, setText] = useState('');
  const { sendMessage } = useChatMessages(channelId);
  const { startTyping, stopTyping } = useTypingIndicator(channelId);
  const themeContext = useTheme(theme);
  
  // 타이핑 인디케이터
  const handleChangeText = (newText: string) => {
    setText(newText);
    
    if (newText.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  };
  
  // 3초간 입력 없으면 타이핑 종료
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.length > 0) {
        stopTyping();
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [text]);
  
  const handleSend = async () => {
    if (!text.trim()) return;
    
    try {
      stopTyping();
      const message = await sendMessage({ content: text.trim() });
      setText('');
      onSend?.(message);
    } catch (error) {
      console.error(error);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: themeContext.colors.background }]}>
      <TextInput
        value={text}
        onChangeText={handleChangeText}
        placeholder="메시지 입력..."
        placeholderTextColor={themeContext.colors.text.secondary}
        style={[styles.input, { color: themeContext.colors.text.primary }]}
        multiline
      />
      
      <TouchableOpacity 
        onPress={handleSend}
        disabled={!text.trim()}
        style={[styles.sendButton, { opacity: text.trim() ? 1 : 0.5 }]}
      >
        <Text style={{ color: themeContext.colors.primary }}>전송</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

#### Week 8: ChannelList + 테마

**Day 1-3: ChannelList 컴포넌트**

**파일**: `src/components/organisms/ChannelList.tsx`

```typescript
interface ChannelListProps {
  onChannelPress: (channel: Channel) => void;
  renderChannelItem?: (channel: Channel) => React.ReactNode;
  theme?: Theme;
}

export function ChannelList({ 
  onChannelPress, 
  renderChannelItem,
  theme 
}: ChannelListProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const chatSDK = useChatSDK();
  const themeContext = useTheme(theme);
  
  useEffect(() => {
    const loadChannels = async () => {
      setLoading(true);
      const result = await chatSDK.channels.list();
      setChannels(result.content);
      setLoading(false);
    };
    
    loadChannels();
  }, []);
  
  // 기본 렌더러
  const defaultRenderItem = (channel: Channel) => (
    <ChannelListItem 
      channel={channel}
      onPress={() => onChannelPress(channel)}
      theme={themeContext}
    />
  );
  
  const renderer = renderChannelItem || defaultRenderItem;
  
  if (loading) {
    return <ActivityIndicator />;
  }
  
  return (
    <FlatList
      data={channels}
      renderItem={({ item }) => renderer(item)}
      keyExtractor={(item) => item.id}
    />
  );
}
```

---

**Day 4-5: ThemeProvider + 기본 테마**

**파일**: `src/theme/ThemeProvider.tsx`

```typescript
const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  const mergedTheme = useMemo(() => {
    return { ...defaultTheme, ...theme };
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(customTheme?: Theme): Theme {
  const contextTheme = useContext(ThemeContext);
  
  if (customTheme) {
    return { ...contextTheme, ...customTheme };
  }
  
  return contextTheme || defaultTheme;
}
```

**파일**: `src/theme/defaultTheme.ts`

```typescript
export const defaultTheme: Theme = {
  colors: {
    primary: '#007AFF',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    error: '#FF3B30',
    
    messageBubble: {
      sent: '#007AFF',
      received: '#E9E9EB',
    },
    
    text: {
      primary: '#000000',
      secondary: '#8E8E93',
      onPrimary: '#FFFFFF',
    },
  },
  
  typography: {
    title: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
    },
    caption: {
      fontSize: 12,
      fontWeight: 'normal',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};
```

---

### 📅 Week 9-11: Phase 4 - E2E 암호화

#### Week 9-10: Signal Protocol 통합

**참고**: 백엔드에서 Signal Protocol API 구현 완료 필요

**Day 1-5: CryptoManager 구현**

**파일**: `src/core/CryptoManager.ts`

```typescript
import { SignalProtocolStore } from './SignalProtocolStore';
import * as libsignal from '@signalapp/libsignal-client';

class CryptoManager {
  private store: SignalProtocolStore;
  private httpClient: HttpClient;
  
  constructor(httpClient: HttpClient) {
    this.store = new SignalProtocolStore();
    this.httpClient = httpClient;
  }
  
  // 키 생성 및 서버 업로드
  async initialize(): Promise<void> {
    // 1. Identity Key 생성
    const identityKeyPair = await libsignal.PrivateKey.generate();
    
    // 2. Signed PreKey 생성
    const signedPreKey = await libsignal.PreKeyBundle.generate();
    
    // 3. OneTime PreKeys 생성 (100개)
    const oneTimePreKeys = await this.generateOneTimePreKeys(100);
    
    // 4. 서버에 공개키 업로드
    await this.httpClient.post('/api/v1/encryption/keys/generate', {
      identityKey: identityKeyPair.publicKey().serialize(),
      signedPreKey: signedPreKey.serialize(),
      oneTimePreKeys: oneTimePreKeys.map(k => k.serialize()),
    });
    
    // 5. 로컬 저장
    await this.store.saveIdentityKeyPair(identityKeyPair);
  }
  
  // 세션 생성
  async createSession(recipientId: string): Promise<void> {
    // 1. 상대방 키 가져오기
    const keys = await this.httpClient.get(`/api/v1/encryption/keys/${recipientId}`);
    
    // 2. Signal Protocol로 세션 생성
    const address = libsignal.ProtocolAddress.new(recipientId, 1);
    const sessionBuilder = new libsignal.SessionBuilder(this.store, address);
    await sessionBuilder.processPreKeyBundle(keys);
  }
  
  // 메시지 암호화
  async encryptMessage(recipientId: string, plaintext: string): Promise<string> {
    const address = libsignal.ProtocolAddress.new(recipientId, 1);
    const cipher = new libsignal.SessionCipher(this.store, address);
    
    const ciphertext = await cipher.encrypt(Buffer.from(plaintext, 'utf8'));
    return ciphertext.serialize().toString('base64');
  }
  
  // 메시지 복호화
  async decryptMessage(senderId: string, ciphertext: string): Promise<string> {
    const address = libsignal.ProtocolAddress.new(senderId, 1);
    const cipher = new libsignal.SessionCipher(this.store, address);
    
    const plaintextBuffer = await cipher.decrypt(
      Buffer.from(ciphertext, 'base64')
    );
    return plaintextBuffer.toString('utf8');
  }
}
```

**백엔드 API**:
- `POST /api/v1/encryption/keys/generate` - 키 업로드
- `GET /api/v1/encryption/keys/{userId}` - 상대방 키 조회
- `POST /api/v1/encryption/session/initiate` - 세션 시작

---

#### Week 11: MessageModule 암호화 통합

**Day 1-5: 암호화 자동 적용**

**파일**: `src/modules/MessageModule.ts` (수정)

```typescript
class MessageModule {
  private crypto: CryptoManager;
  
  async send(channelId: string, params: SendMessageParams): Promise<Message> {
    let encryptedContent = params.content;
    
    // E2E 암호화 활성화 시
    if (this.config.enableE2EEncryption && params.type === 'TEXT') {
      const recipientId = await this.getRecipientId(channelId);
      
      // 세션 없으면 생성
      if (!await this.crypto.hasSession(recipientId)) {
        await this.crypto.createSession(recipientId);
      }
      
      // 암호화
      encryptedContent = await this.crypto.encryptMessage(recipientId, params.content);
    }
    
    const response = await this.httpClient.post<Message>(
      `/api/v1/chat/channels/${channelId}/messages`,
      {
        type: params.type,
        content: '[암호화됨]', // 서버에는 플레이스홀더만
        encryptedContent,
      }
    );
    
    return response;
  }
  
  // 메시지 수신 시 자동 복호화
  onMessage(callback: (message: Message) => void) {
    return this.eventEmitter.on('message.new', async (message) => {
      if (message.encryptedContent) {
        try {
          const decryptedContent = await this.crypto.decryptMessage(
            message.senderId,
            message.encryptedContent
          );
          message.content = decryptedContent;
        } catch (error) {
          console.error('복호화 실패:', error);
          message.content = '[복호화 실패]';
        }
      }
      
      callback(message);
    });
  }
}
```

---

### 📅 Week 12-13: Phase 5 - 고급 기능

#### Week 12: 파일 업로드

**Day 1-3: 이미지 업로드**

**파일**: `src/modules/FileModule.ts`

```typescript
class FileModule {
  constructor(private httpClient: HttpClient) {}
  
  async uploadImage(params: UploadImageParams): Promise<UploadedImage> {
    const formData = new FormData();
    formData.append('file', {
      uri: params.uri,
      type: params.type,
      name: params.name,
    });
    
    const response = await this.httpClient.upload<UploadedImage>(
      '/api/v1/files/upload',
      formData,
      (percent) => {
        params.onProgress?.(percent);
      }
    );
    
    return response;
  }
}
```

**백엔드 API**:
- `POST /api/v1/files/upload` - 파일 업로드
- 이미지 최적화 (백엔드에서 처리)

---

**Day 4-5: 프로필 이미지 업로드**

```typescript
// MessageModule에 이미지 전송 추가
async sendImage(channelId: string, params: SendImageParams): Promise<Message> {
  // 1. 파일 업로드
  const uploadedImage = await this.fileModule.uploadImage({
    uri: params.uri,
    type: params.type,
    name: params.name,
  });
  
  // 2. 메시지 전송
  return this.send(channelId, {
    type: 'IMAGE',
    content: params.caption || '',
    metadata: {
      imageUrl: uploadedImage.url,
      width: uploadedImage.width,
      height: uploadedImage.height,
      blurhash: uploadedImage.blurhash,
    },
  });
}
```

---

#### Week 13: 알림 + 캐싱

**Day 1-2: FCM 통합**

**파일**: `src/modules/NotificationModule.ts`

```typescript
import messaging from '@react-native-firebase/messaging';

class NotificationModule {
  async registerPushToken(): Promise<void> {
    const token = await messaging().getToken();
    
    await this.httpClient.post('/api/v1/notifications/tokens', {
      token,
      platform: Platform.OS,
    });
  }
  
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
}
```

---

**Day 3-5: 로컬 캐싱**

**파일**: `src/modules/CacheModule.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

class CacheModule {
  async cacheMessages(channelId: string, messages: Message[]): Promise<void> {
    const key = `messages:${channelId}`;
    await AsyncStorage.setItem(key, JSON.stringify(messages));
  }
  
  async getCachedMessages(channelId: string): Promise<Message[]> {
    const key = `messages:${channelId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
  
  async invalidateCache(keys?: string[]): Promise<void> {
    if (keys) {
      await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
    } else {
      await AsyncStorage.clear();
    }
  }
}
```

---

### 📅 Week 14: Phase 6 - 문서화 & 배포

**Day 1-2: 예제 앱 작성**

1. **Basic Example** (UI Kit 모드)
```typescript
import { ChatProvider, ChannelList, MessageList, MessageInput } from '@yourcompany/chat-sdk';

function BasicChatApp() {
  return (
    <ChatProvider theme={myTheme}>
      <ChannelList onChannelPress={(ch) => navigate('Chat', { ch })} />
    </ChatProvider>
  );
}
```

2. **Custom Example** (Headless 모드)
```typescript
import { useChatMessages } from '@yourcompany/chat-sdk';

function CustomChatApp() {
  const { messages, sendMessage } = useChatMessages(channelId);
  
  return (
    <MyCustomUI messages={messages} onSend={sendMessage} />
  );
}
```

3. **Hybrid Example** (하이브리드)
```typescript
import { MessageList } from '@yourcompany/chat-sdk';

function HybridApp() {
  return (
    <MessageList
      channelId={channelId}
      renderMessage={(msg) => <MyCustomBubble message={msg} />}
    />
  );
}
```

---

**Day 3-4: API 문서화**

- TypeDoc 생성
- README.md 작성
- CHANGELOG.md
- Migration Guide

---

**Day 5: NPM 배포**

```bash
# 빌드
npm run build

# 테스트
npm test

# 배포
npm publish --access public
```

---

## 5. API 매핑 테이블

### REST API 매핑

| SDK Method | HTTP Method | Backend Endpoint | 상태 |
|------------|-------------|------------------|------|
| `channels.create()` | POST | `/api/v1/chat/channels` | ✅ 구현됨 |
| `channels.list()` | GET | `/api/v1/chat/channels` | ✅ 구현됨 |
| `channels.get(id)` | GET | `/api/v1/chat/channels/{id}` | ✅ 구현됨 |
| `channels.leave(id)` | DELETE | `/api/v1/chat/channels/{id}/leave` | ✅ 구현됨 |
| `messages.send()` | POST | `/api/v1/chat/channels/{id}/messages` | ✅ 구현됨 |
| `messages.list()` | GET | `/api/v1/chat/channels/{id}/messages` | ✅ 구현됨 |
| `messages.edit()` | PUT | `/api/v1/chat/channels/{id}/messages/{msgId}` | ⏳ 백엔드 작업 필요 |
| `messages.delete()` | DELETE | `/api/v1/chat/channels/{id}/messages/{msgId}` | ⏳ 백엔드 작업 필요 |
| `messages.markAsRead()` | POST | `/api/v1/chat/channels/{id}/messages/{msgId}/read` | ⏳ 백엔드 작업 필요 |
| `crypto.initialize()` | POST | `/api/v1/encryption/keys/generate` | ⏳ 백엔드 작업 필요 |
| `crypto.getKeys()` | GET | `/api/v1/encryption/keys/{userId}` | ⏳ 백엔드 작업 필요 |
| `files.uploadImage()` | POST | `/api/v1/files/upload` | ⏳ 백엔드 작업 필요 |
| `notifications.register()` | POST | `/api/v1/notifications/tokens` | ✅ 구현됨 |

### WebSocket 매핑

| SDK Method | STOMP Destination | 상태 |
|------------|-------------------|------|
| `wsClient.connect()` | `/ws` | ✅ 구현됨 |
| `messages.onMessage()` | `/user/queue/messages` | ✅ 구현됨 |
| `messages.onMessage()` | `/topic/channels/{id}` | ✅ 구현됨 |
| `channels.startTyping()` | `/app/typing/start` | ⏳ 백엔드 작업 필요 |
| `channels.onTyping()` | `/topic/channel.{id}.typing` | ⏳ 백엔드 작업 필요 |
| `readReceipts.on()` | `/user/queue/read-receipts` | ⏳ 백엔드 작업 필요 |

---

## 6. UI 구현 전략

### 6.1 3가지 사용 레벨

**Level 1: UI Kit 모드 (초보자)**
```typescript
// 5분 내 구현
<ChannelList />
<MessageList channelId={id} />
<MessageInput channelId={id} />
```

**Level 2: 하이브리드 (중급자)**
```typescript
// 일부만 커스터마이징
<MessageList
  channelId={id}
  renderMessage={(msg) => <CustomBubble />}
/>
```

**Level 3: Headless (고급자)**
```typescript
// 100% 커스텀
const { messages, sendMessage } = useChatMessages(id);
// 완전 자유로운 UI
```

### 6.2 테마 시스템

```typescript
<ChatProvider theme={customTheme}>
  <App />
</ChatProvider>
```

---

## 7. 백엔드 병렬 개발 필요 사항

### 우선순위 1 (SDK Phase 2와 함께)
- [ ] 타이핑 인디케이터 API
- [ ] 읽음 표시 API
- [ ] 매칭 해제 처리

### 우선순위 2 (SDK Phase 4와 함께)
- [ ] E2E 암호화 API (키 생성/교환)
- [ ] 메시지 수정/삭제 API

### 우선순위 3 (SDK Phase 5와 함께)
- [ ] 파일 업로드 API
- [ ] 이미지 최적화 서비스

---

## 8. 다음 단계

**즉시 시작 가능**:
1. Week 1 Day 1-2: 프로젝트 초기 설정
2. Week 1 Day 3-4: AuthManager 구현
3. Week 1 Day 5: HttpClient 구현

**백엔드와 협의 필요**:
1. API 엔드포인트 최종 확인
2. WebSocket 토픽 구조 확정
3. E2E 암호화 키 교환 프로토콜

**의사결정 필요**:
1. NPM 패키지 이름
2. 버전 관리 전략
3. 배포 파이프라인

---

## 마무리

이 계획표는 백엔드 현황을 반영하여 작성되었어요:
- ✅ **현재 구현된 API는 즉시 연동** 가능
- ⏳ **미구현 API는 백엔드 작업과 병렬** 진행
- 🎯 **UI Kit은 Phase 3부터** 시작하여 유연성 확보

**예상 총 기간**: 14주 (약 3.5개월)

어디서부터 시작할까요? 🚀
