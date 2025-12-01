/**
 * CupidClientSdk Demo App
 * SDK의 UI 컴포넌트를 테스트하는 데모 앱입니다.
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
// Import everything from main package to ensure shared ThemeContext
import {
  ThemeProvider,
  useTheme,
  Avatar,
  MessageBubble,
  InputBar,
  ConversationListItem,
  TypingIndicator,
  StatusBadge,
  UnreadBadge,
  Button,
  Box,
} from 'august-design-system';

// Demo screen selector
type DemoScreen = 'home' | 'messages' | 'channels' | 'components';

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar barStyle="dark-content" />
        <DemoApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function DemoApp() {
  const {theme} = useTheme();
  const [currentScreen, setCurrentScreen] = useState<DemoScreen>('home');

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.colors.background.primary}]}
      edges={['top']}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: theme.colors.separator.opaque}]}>
        <Text style={[styles.headerTitle, {color: theme.colors.label.primary}]}>
          Cupid Chat SDK Demo
        </Text>
      </View>

      {/* Content */}
      {currentScreen === 'home' && <HomeScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'messages' && <MessagesDemo onBack={() => setCurrentScreen('home')} />}
      {currentScreen === 'channels' && <ChannelsDemo onBack={() => setCurrentScreen('home')} />}
      {currentScreen === 'components' && <ComponentsDemo onBack={() => setCurrentScreen('home')} />}
    </SafeAreaView>
  );
}

// Home Screen - Navigation
function HomeScreen({onNavigate}: {onNavigate: (screen: DemoScreen) => void}) {
  const {theme} = useTheme();

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.homeContent}>
      <Text style={[styles.sectionTitle, {color: theme.colors.label.primary}]}>
        SDK Demo Screens
      </Text>

      <TouchableOpacity
        style={[styles.menuItem, {backgroundColor: theme.colors.background.secondary}]}
        onPress={() => onNavigate('messages')}>
        <Text style={[styles.menuTitle, {color: theme.colors.label.primary}]}>
          Messages Demo
        </Text>
        <Text style={[styles.menuDesc, {color: theme.colors.label.secondary}]}>
          MessageBubble, TypingIndicator, InputBar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.menuItem, {backgroundColor: theme.colors.background.secondary}]}
        onPress={() => onNavigate('channels')}>
        <Text style={[styles.menuTitle, {color: theme.colors.label.primary}]}>
          Channels Demo
        </Text>
        <Text style={[styles.menuDesc, {color: theme.colors.label.secondary}]}>
          ConversationListItem, Avatar, Badges
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.menuItem, {backgroundColor: theme.colors.background.secondary}]}
        onPress={() => onNavigate('components')}>
        <Text style={[styles.menuTitle, {color: theme.colors.label.primary}]}>
          All Components
        </Text>
        <Text style={[styles.menuDesc, {color: theme.colors.label.secondary}]}>
          Individual component showcase
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Messages Demo
function MessagesDemo({onBack}: {onBack: () => void}) {
  const {theme} = useTheme();
  const [inputText, setInputText] = useState('');
  const showTyping = true; // Demo: always show typing indicator

  return (
    <View style={styles.demoContainer}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={{color: theme.colors.interactive.tint}}>← Back</Text>
      </TouchableOpacity>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
        <MessageBubble
          direction="incoming"
          text="안녕하세요! 오늘 날씨가 좋네요 ☀️"
          timestamp={new Date(Date.now() - 3600000)}
          senderName="지민"
          showSenderName
          isFirstInGroup
          isLastInGroup={false}
        />

        <MessageBubble
          direction="incoming"
          text="주말에 같이 카페 갈래요?"
          timestamp={new Date(Date.now() - 3500000)}
          isFirstInGroup={false}
          isLastInGroup
        />

        <MessageBubble
          direction="outgoing"
          text="좋아요! 어디로 갈까요?"
          timestamp={new Date(Date.now() - 3000000)}
          status="read"
          isFirstInGroup
          isLastInGroup
        />

        <MessageBubble
          direction="incoming"
          text="강남역 근처에 새로 생긴 곳이 있는데, 분위기가 정말 좋대요!"
          timestamp={new Date(Date.now() - 2000000)}
          isFirstInGroup
          isLastInGroup
        />

        <MessageBubble
          direction="outgoing"
          text="오 좋아요 👍 몇 시에 만날까요?"
          timestamp={new Date(Date.now() - 1000000)}
          status="delivered"
          isFirstInGroup
          isLastInGroup
        />

        {/* Typing indicator */}
        {showTyping && (
          <View style={styles.typingContainer}>
            <TypingIndicator
              isTyping
              variant="bubble"
              typingUsers={['지민']}
            />
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <InputBar
        value={inputText}
        onChangeText={setInputText}
        placeholder="메시지 입력..."
        onSend={() => {
          console.log('Send:', inputText);
          setInputText('');
        }}
        onAttachment={() => console.log('Attachment pressed')}
      />
    </View>
  );
}

// Channels Demo
function ChannelsDemo({onBack}: {onBack: () => void}) {
  const {theme} = useTheme();

  const channels = [
    {
      id: '1',
      title: '지민',
      subtitle: '주말에 같이 카페 갈래요?',
      timestamp: new Date(Date.now() - 60000),
      unreadCount: 2,
      status: 'online' as const,
    },
    {
      id: '2',
      title: '수현',
      subtitle: '사진 보내줘서 고마워!',
      timestamp: new Date(Date.now() - 3600000),
      unreadCount: 0,
      status: 'offline' as const,
    },
    {
      id: '3',
      title: '개발팀 채널',
      subtitle: '민수: 배포 완료했습니다',
      timestamp: new Date(Date.now() - 7200000),
      unreadCount: 5,
      isGroup: true,
    },
    {
      id: '4',
      title: '현우',
      subtitle: '내일 회의 시간 확인해주세요',
      timestamp: new Date(Date.now() - 86400000),
      unreadCount: 0,
      status: 'away' as const,
      isMuted: true,
    },
  ];

  return (
    <View style={styles.demoContainer}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={{color: theme.colors.interactive.tint}}>← Back</Text>
      </TouchableOpacity>

      <ScrollView>
        {channels.map((channel, index) => (
          <React.Fragment key={channel.id}>
            <ConversationListItem
              id={channel.id}
              title={channel.title}
              subtitle={channel.subtitle}
              timestamp={channel.timestamp}
              unreadCount={channel.unreadCount}
              presenceStatus={channel.status}
              isGroup={channel.isGroup}
              isMuted={channel.isMuted}
              avatarName={channel.title}
              onPress={() => console.log('Channel pressed:', channel.title)}
            />
            {index < channels.length - 1 && (
              <View
                style={[
                  styles.separator,
                  {backgroundColor: theme.colors.separator.opaque},
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

// Components Demo
function ComponentsDemo({onBack}: {onBack: () => void}) {
  const {theme} = useTheme();

  return (
    <View style={styles.demoContainer}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={{color: theme.colors.interactive.tint}}>← Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.componentsContent}>
        {/* Avatars */}
        <Text style={[styles.componentTitle, {color: theme.colors.label.primary}]}>
          Avatar
        </Text>
        <View style={styles.row}>
          <Avatar name="김지민" size="xs" />
          <Avatar name="박수현" size="sm" />
          <Avatar name="이현우" size="md" status="online" />
          <Avatar name="최민수" size="lg" status="away" />
        </View>

        {/* Status Badges */}
        <Text style={[styles.componentTitle, {color: theme.colors.label.primary}]}>
          StatusBadge
        </Text>
        <View style={styles.row}>
          <StatusBadge status="online" />
          <StatusBadge status="offline" />
          <StatusBadge status="away" />
          <StatusBadge status="busy" />
        </View>

        {/* Unread Badges */}
        <Text style={[styles.componentTitle, {color: theme.colors.label.primary}]}>
          UnreadBadge
        </Text>
        <View style={styles.row}>
          <UnreadBadge count={1} />
          <UnreadBadge count={5} />
          <UnreadBadge count={99} />
          <UnreadBadge count={100} />
        </View>

        {/* Typing Indicator */}
        <Text style={[styles.componentTitle, {color: theme.colors.label.primary}]}>
          TypingIndicator
        </Text>
        <View style={styles.typingRow}>
          <TypingIndicator isTyping variant="dots" />
        </View>
        <View style={styles.typingRow}>
          <TypingIndicator isTyping variant="text" typingUsers={['지민']} />
        </View>
        <View style={styles.typingRow}>
          <TypingIndicator isTyping variant="bubble" />
        </View>

        {/* Buttons */}
        <Text style={[styles.componentTitle, {color: theme.colors.label.primary}]}>
          Button
        </Text>
        <View style={styles.buttonRow}>
          <Button title="Primary" variant="filled" />
          <Button title="Secondary" variant="outlined" />
          <Button title="Ghost" variant="ghost" />
        </View>

        {/* Box */}
        <Text style={[styles.componentTitle, {color: theme.colors.label.primary}]}>
          Box
        </Text>
        <Box
          padding="lg"
          borderRadius="md"
          backgroundColor="background.secondary"
          shadow="sm">
          <Text style={{color: theme.colors.label.primary}}>
            Box with padding, border radius, and shadow
          </Text>
        </Box>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  homeContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  menuItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 14,
  },
  demoContainer: {
    flex: 1,
  },
  backButton: {
    padding: 16,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  typingContainer: {
    marginTop: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 76,
  },
  componentsContent: {
    padding: 16,
  },
  componentTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typingRow: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
});

export default App;