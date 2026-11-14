import { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { Skeleton } from 'heroui-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  Screen,
  TopBar,
  Copy,
  Pill,
  GreyCard,
  TransferRow,
  Empty,
} from '@/components/wise';
import { RolePicker } from '@/app/roles';
import { useWise, money } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';

export default function HomeScreen() {
  const { role: previewRole } = useLocalSearchParams<{ role?: string }>();
  const role = useWise((s) => s.role);
  const ready = useWise((s) => s.ready);
  const offline = useWise((s) => s.offline);
  const setRole = useWise((s) => s.setRole);
  useEffect(() => {
    if (ready && (previewRole === 'maria' || previewRole === 'nikita')) setRole(previewRole);
  }, [ready, previewRole, setRole]);
  if (!ready)
    return (
      <Screen safe>
        {offline ? (
          <Copy size={16} color={c.muted}>
            Can’t reach the server. Start it and this screen will load by itself.
          </Copy>
        ) : null}
        <Skeleton style={{ height: 48, borderRadius: 24 }} />
        <Skeleton style={{ height: 110, borderRadius: 24 }} />
        <Skeleton style={{ height: 220, borderRadius: 24 }} />
      </Screen>
    );
  if (!role) return <RolePicker />;
  return role === 'nikita' ? <Redirect href="/full" /> : <MariaHome />;
}
function MariaHome() {
  const balance = useWise((s) => s.balance);
  const transfers = useWise((s) => s.transfers);
  const invite = useWise((s) => s.inviteSent);
  const consent = useWise((s) => s.consent);
  return (
    <Screen safe style={{ gap: 28, paddingBottom: 8 }}>
      <TopBar />
      {invite && !consent ? (
        <Pressable
          onPress={() => router.push('/onboarding')}
          style={{ backgroundColor: c.yellow, borderRadius: 24, padding: 20 }}
        >
          <Copy bold size={18}>
            Nikita sent you an invite
          </Copy>
          <Copy size={16} color={c.yellowText}>
            Tap to set up your Trusted Helper
          </Copy>
        </Pressable>
      ) : null}
      <View style={{ gap: 3 }}>
        <Copy size={18} color={c.muted}>
          Total balance
        </Copy>
        <Copy
          size={52}
          bold
          style={{ fontFamily: 'Inter_700Bold', lineHeight: 65, letterSpacing: -2.5 }}
          maxFontSizeMultiplier={1.15}
        >
          {money(balance, true)}
        </Copy>
      </View>
      <View style={{ gap: 12 }}>
        <Pill icon={ArrowUpRight} onPress={() => router.push('/send')}>
          Send money
        </Pill>
        <Pill icon={ArrowDownLeft} tone="pale" onPress={() => router.push('/request')}>
          Ask for money
        </Pill>
      </View>
      <GreyCard style={{ padding: 20, paddingBottom: 6, gap: 4 }}>
        <Copy size={21} bold>
          Recent
        </Copy>
        {transfers.length ? (
          transfers.slice(0, 3).map((t, index) => (
            <Animated.View
              key={t.id}
              entering={FadeIn}
              exiting={FadeOut}
              style={
                index !== Math.min(transfers.length, 3) - 1
                  ? { borderBottomWidth: 1, borderBottomColor: c.border }
                  : undefined
              }
            >
              <TransferRow transfer={t} />
            </Animated.View>
          ))
        ) : (
          <Empty icon={ArrowUpRight} action="Send money" onPress={() => router.push('/send')}>
            Your transfers will appear here.
          </Empty>
        )}
      </GreyCard>
    </Screen>
  );
}
