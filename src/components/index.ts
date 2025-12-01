/**
 * components - UI Components Export
 * SDK의 UI 컴포넌트들을 제공합니다.
 */

// Provider
export {ChatProvider} from './ChatProvider';

// Message Components
export {ChatMessageList} from './ChatMessageList';
export {ChatInput} from './ChatInput';

// Channel Components
export {ChatChannelList} from './ChatChannelList';

// Screen Components
export {ChatScreen} from './ChatScreen';

// Re-export design system components for convenience
// Import from august-design-system/components for UI components
export {
  Avatar,
  MessageBubble,
  InputBar,
  ConversationListItem,
  TypingIndicator,
  StatusBadge,
  UnreadBadge,
  Button,
  Box,
  Icon,
} from 'august-design-system/components';

// Re-export theme utilities from main package
export {
  ThemeProvider,
  useTheme,
  useColors,
  useSpacing,
  useTypography,
  useIsDarkMode,
  useColorMode,
  spacing,
  typography,
  radius,
} from 'august-design-system';