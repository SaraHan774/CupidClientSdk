/**
 * ChatInput - 메시지 입력 컴포넌트
 * SDK의 useTypingIndicator와 design system의 InputBar를 결합합니다.
 */

import React, {useState, useCallback} from 'react';
import {View, StyleSheet, type ViewStyle} from 'react-native';
import {InputBar} from 'august-design-system/components';
import {useChatMessages} from '../hooks/useChatMessages';
import {useTypingIndicator} from '../hooks/useTypingIndicator';
import type {SendMessageParams} from '../types/Message';

interface ChatInputProps {
  /** 채널 ID */
  channelId: string;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 비활성화 메시지 */
  disabledMessage?: string;
  /** 첨부 버튼 표시 여부 */
  showAttachmentButton?: boolean;
  /** 첨부 버튼 클릭 핸들러 */
  onAttachment?: () => void;
  /** 메시지 전송 성공 콜백 */
  onSendSuccess?: () => void;
  /** 메시지 전송 실패 콜백 */
  onSendError?: (error: Error) => void;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 에러 닫기 핸들러 */
  onDismissError?: () => void;
  /** 답장 대상 메시지 ID */
  replyToMessageId?: string;
  /** 컨테이너 스타일 */
  style?: ViewStyle;
}

/**
 * ChatInput
 *
 * 메시지 입력 컴포넌트입니다.
 * 타이핑 인디케이터와 자동으로 연동됩니다.
 *
 * @example
 * ```tsx
 * <ChatInput
 *   channelId="channel-123"
 *   placeholder="메시지를 입력하세요..."
 *   onAttachment={() => showAttachmentPicker()}
 * />
 * ```
 */
export function ChatInput({
  channelId,
  placeholder = '메시지 입력...',
  disabled = false,
  disabledMessage,
  showAttachmentButton = true,
  onAttachment,
  onSendSuccess,
  onSendError,
  errorMessage,
  onDismissError,
  replyToMessageId,
  style,
}: ChatInputProps): React.JSX.Element {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  // SDK Hooks
  const {sendMessage} = useChatMessages(channelId, {autoFetch: false});
  const {handleTextChange, stopTyping} = useTypingIndicator(channelId);

  // 텍스트 변경 핸들러
  const handleChangeText = useCallback(
    (newText: string) => {
      setText(newText);
      handleTextChange(newText);
    },
    [handleTextChange],
  );

  // 전송 핸들러
  const handleSend = useCallback(async () => {
    const trimmedText = text.trim();
    if (!trimmedText || sending) {
      return;
    }

    setSending(true);
    stopTyping();

    try {
      const params: SendMessageParams = {
        content: trimmedText,
        type: 'TEXT',
      };

      if (replyToMessageId) {
        params.replyTo = replyToMessageId;
      }

      await sendMessage(params);
      setText('');
      onSendSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onSendError?.(err);
    } finally {
      setSending(false);
    }
  }, [text, sending, sendMessage, stopTyping, replyToMessageId, onSendSuccess, onSendError]);

  return (
    <View style={[styles.container, style]}>
      <InputBar
        value={text}
        placeholder={placeholder}
        onChangeText={handleChangeText}
        onSend={handleSend}
        onAttachment={onAttachment}
        disabled={disabled}
        sending={sending}
        disabledMessage={disabledMessage}
        showAttachmentButton={showAttachmentButton}
        errorMessage={errorMessage}
        onDismissError={onDismissError}
        testID="chat-input"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // InputBar가 자체 스타일을 가지므로 최소한의 컨테이너만 제공
  },
});