/**
 * useChatChannel - 채널 정보 및 관리 Hook
 */

import {useState, useEffect, useCallback} from 'react';
import {useRequiredChatSDK} from './ChatSDKProvider';
import type {Channel, ChannelMember, UpdateChannelParams} from '../types/Channel';
import type {UnsubscribeFunction} from '../types/Common';

interface UseChatChannelOptions {
  autoFetch?: boolean;
}

interface UseChatChannelReturn {
  channel: Channel | null;
  members: ChannelMember[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  update: (params: UpdateChannelParams) => Promise<Channel>;
  leave: () => Promise<void>;
}

export function useChatChannel(
  channelId: string,
  options: UseChatChannelOptions = {},
): UseChatChannelReturn {
  const {autoFetch = true} = options;
  const sdk = useRequiredChatSDK();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 채널 정보 로드
  const loadChannel = useCallback(async () => {
    if (!channelId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const channelData = await sdk.channels.get(channelId);
      setChannel(channelData);
      setMembers(channelData.members || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [sdk, channelId]);

  // 자동 로드
  useEffect(() => {
    if (autoFetch) {
      loadChannel();
    }
  }, [autoFetch, loadChannel]);

  // 채널 업데이트 이벤트 구독
  useEffect(() => {
    const unsubscribes: UnsubscribeFunction[] = [];

    // 채널 업데이트 이벤트
    unsubscribes.push(
      sdk.channels.onChannelUpdated(({channel: updatedChannel}) => {
        if (updatedChannel.id === channelId) {
          setChannel(updatedChannel);
        }
      }),
    );

    // 멤버 가입 이벤트
    unsubscribes.push(
      sdk.channels.onMemberJoined(({channelId: eventChannelId, userId}) => {
        if (eventChannelId === channelId) {
          // 멤버 정보 다시 로드
          loadChannel();
        }
      }),
    );

    // 멤버 퇴장 이벤트
    unsubscribes.push(
      sdk.channels.onMemberLeft(({channelId: eventChannelId, userId}) => {
        if (eventChannelId === channelId) {
          setMembers(prev => prev.filter(m => m.userId !== userId));
        }
      }),
    );

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [sdk, channelId, loadChannel]);

  // 채널 업데이트
  const update = useCallback(
    async (params: UpdateChannelParams): Promise<Channel> => {
      const updatedChannel = await sdk.channels.update(channelId, params);
      setChannel(updatedChannel);
      return updatedChannel;
    },
    [sdk, channelId],
  );

  // 채널 나가기
  const leave = useCallback(async () => {
    await sdk.channels.leave(channelId);
    setChannel(null);
    setMembers([]);
  }, [sdk, channelId]);

  return {
    channel,
    members,
    loading,
    error,
    refresh: loadChannel,
    update,
    leave,
  };
}