/**
 * ChatScreen - 완성된 채팅 화면 컴포넌트
 * MessageList, Input, TypingIndicator를 결합한 완성된 채팅 화면입니다.
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from 'august-design-system';
import {ChatMessageList} from './ChatMessageList';
import {ChatInput} from './ChatInput';
import {useChatChannel} from '../hooks/useChatChannel';
import type {Message} from '../types/Message';
import type {Channel} from '../types/Channel';

interface ChatScreenProps {
  /** 채널 ID */
  channelId: string;
  /** 헤더 컴포넌트 */
  HeaderComponent?: React.ComponentType<{channel: Channel | null}>;
  /** 커스텀 메시지 렌더러 */
  renderMessage?: (message: Message, isMine: boolean) => React.ReactNode;
  /** 메시지 클릭 핸들러 */
  onMessagePress?: (message: Message) => void;
  /** 메시지 롱프레스 핸들러 */
  onMessageLongPress?: (message: Message) => void;
  /** 이미지 클릭 핸들러 */
  onImagePress?: (message: Message) => void;
  /** 파일 클릭 핸들러 */
  onFilePress?: (message: Message) => void;
  /** 첨부 버튼 클릭 핸들러 */
  onAttachment?: () => void;
  /** 에러 핸들러 */
  onError?: (error: Error) => void;
  /** 입력 플레이스홀더 */
  inputPlaceholder?: string;
  /** 첨부 버튼 표시 */
  showAttachmentButton?: boolean;
  /** 타이핑 인디케이터 표시 */
  showTypingIndicator?: boolean;
  /** 그룹 채팅 여부 (자동 감지 가능) */
  isGroupChat?: boolean;
  /** SafeArea 사용 여부 */
  useSafeArea?: boolean;
  /** 컨테이너 스타일 */
  style?: ViewStyle;
  /** 메시지 목록 스타일 */
  messageListStyle?: ViewStyle;
  /** 입력창 스타일 */
  inputStyle?: ViewStyle;
}

/**
 * ChatScreen
 *
 * 완성된 채팅 화면 컴포넌트입니다.
 * 메시지 목록, 입력창, 타이핑 인디케이터가 모두 포함되어 있습니다.
 *
 * @example
 * ```tsx
 * // 기본 사용
 * <ChatScreen
 *   channelId="channel-123"
 *   onMessageLongPress={(msg) => showMessageOptions(msg)}
 *   onAttachment={() => showAttachmentPicker()}
 * />
 *
 * // 커스텀 헤더와 함께
 * <ChatScreen
 *   channelId="channel-123"
 *   HeaderComponent={({channel}) => <ChatHeader channel={channel} />}
 * />
 * ```
 */
export function ChatScreen({
  channelId,
  HeaderComponent,
  renderMessage,
  onMessagePress,
  onMessageLongPress,
  onImagePress,
  onFilePress,
  onAttachment,
  onError,
  inputPlaceholder,
  showAttachmentButton = true,
  showTypingIndicator = true,
  isGroupChat,
  useSafeArea = true,
  style,
  messageListStyle,
  inputStyle,
}: ChatScreenProps): React.JSX.Element {
  const {theme} = useTheme();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // 채널 정보 로드
  const {channel} = useChatChannel(channelId);

  // 그룹 채팅 여부 (props로 전달되지 않으면 채널 타입으로 자동 감지)
  const isGroup = isGroupChat ?? channel?.type === 'GROUP';

  // 에러 핸들러
  const handleSendError = useCallback(
    (error: Error) => {
      setErrorMessage(error.message);
      onError?.(error);
    },
    [onError],
  );

  // 에러 닫기
  const handleDismissError = useCallback(() => {
    setErrorMessage(undefined);
  }, []);

  const Container = useSafeArea ? SafeAreaView : View;

  return (
    <Container
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
        style,
      ]}
      edges={useSafeArea ? ['bottom'] : undefined}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {/* 커스텀 헤더 */}
        {HeaderComponent && <HeaderComponent channel={channel} />}

        {/* 메시지 목록 */}
        <ChatMessageList
          channelId={channelId}
          renderMessage={renderMessage}
          onMessagePress={onMessagePress}
          onMessageLongPress={onMessageLongPress}
          onImagePress={onImagePress}
          onFilePress={onFilePress}
          showTypingIndicator={showTypingIndicator}
          isGroupChat={isGroup}
          style={StyleSheet.flatten([styles.messageList, messageListStyle])}
        />

        {/* 입력창 */}
        <ChatInput
          channelId={channelId}
          placeholder={inputPlaceholder}
          showAttachmentButton={showAttachmentButton}
          onAttachment={onAttachment}
          onSendError={handleSendError}
          errorMessage={errorMessage}
          onDismissError={handleDismissError}
          style={inputStyle}
        />
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
});