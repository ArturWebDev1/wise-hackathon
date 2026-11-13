import { useEffect } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
  Clock3,
  ShieldCheck,
} from 'lucide-react-native';
import { Skeleton } from 'heroui-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  Screen,
  TopBar,
  Copy,
  Pill,
  GreyCard,
  TransferRow,
  DashedCard,
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
  return role === 'nikita' ? <HelperHome /> : <MariaHome />;
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
function HelperHome() {
  const transfers = useWise((s) => s.transfers);
  const pending = transfers.filter((t) => t.status === 'pending');
  const blocked = transfers.find((t) => t.status === 'blocked');
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.white }}>
      <FlatList
        data={transfers}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 24, marginBottom: 4 }}>
            <TopBar helper />
            <Copy size={28} bold style={{ letterSpacing: -1 }}>
              You protect:{'\n'}Maria (Mom)
            </Copy>
            <Pill icon={ArrowUpRight} onPress={() => router.push('/send-maria')}>
              Send money to Maria
            </Pill>
            {pending.length ? (
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/approval', params: { id: pending[0].id } })
                }
                style={{ backgroundColor: c.yellow, borderRadius: 24, padding: 20, gap: 8 }}
              >
                <Clock3 size={24} color={c.yellowText} strokeWidth={1.8} />
                <Copy bold size={18} color={c.yellowText}>
                  {pending.length} {pending.length === 1 ? 'request needs' : 'requests need'} your
                  answer
                </Copy>
                <Copy size={14} color={c.yellowText}>
                  Review transfer
                </Copy>
              </Pressable>
            ) : null}
            {blocked ? (
              <Pressable
                onPress={() => router.push({ pathname: '/approval', params: { id: blocked.id } })}
                style={{ backgroundColor: c.dangerPale, borderRadius: 24, padding: 20, gap: 8 }}
              >
                <ShieldCheck color={c.dangerText} size={24} />
                <Copy size={17} bold color={c.dangerText}>
                  Scam Pause protected Mom
                </Copy>
                <Copy size={14} color={c.dangerText}>
                  She said someone was calling. Her transfer was blocked.
                </Copy>
              </Pressable>
            ) : null}
            <Copy size={20} bold>
              Mom’s activity
            </Copy>
          </View>
        }
        renderItem={({ item }) => (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={{ borderBottomWidth: 1, borderBottomColor: c.card }}
          >
            <TransferRow transfer={item} helper />
          </Animated.View>
        )}
        ListEmptyComponent={
          <Empty icon={ShieldCheck} action="Invite Mom" onPress={() => router.push('/onboarding')}>
            Mom’s transfers will appear here.
          </Empty>
        }
        ListFooterComponent={
          <View style={{ gap: 16, paddingTop: 28 }}>
            <DashedCard
              title="Rules"
              icon={SlidersHorizontal}
              compact
              onPress={() => router.push('/rules')}
            />
            <Pill small tone="pale" onPress={() => router.push('/onboarding')}>
              Invite Mom
            </Pill>
          </View>
        }
      />
    </SafeAreaView>
  );
}
