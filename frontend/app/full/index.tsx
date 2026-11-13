import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowUpRight,
  Plus,
  Upload,
  CreditCard,
  Wallet,
  Landmark,
  TrendingUp,
  Gift,
  ChevronRight,
  Clock3,
  ShieldCheck,
} from 'lucide-react-native';
import { Screen, TopBar, Copy, Pill, DashedCard, IconCircle } from '@/components/wise';
import { wise as c } from '@/lib/wise-theme';
import { useWise, money } from '@/lib/wise-store';

export default function FullHome() {
  const balance = useWise((s) => s.balance);
  const helper = useWise((s) => s.role) === 'nikita';
  const pending = useWise((s) => s.transfers.filter((t) => t.status === 'pending').length);
  return (
    <Screen style={{ padding: 20, gap: 20 }}>
      <TopBar full />
      <View style={{ gap: 4 }}>
        <Copy size={13} color={c.muted}>
          Total balance
        </Copy>
        <Copy bold size={37} style={{ letterSpacing: -1.7 }}>
          {money(balance, true)}
        </Copy>
      </View>
      <View style={{ flexDirection: 'row', gap: 7 }}>
        <View style={{ flex: 1 }}>
          <Pill small dense icon={ArrowUpRight} onPress={() => router.push('/send')}>
            Send
          </Pill>
        </View>
        <View style={{ flex: 1.5 }}>
          <Pill small dense icon={Plus} tone="pale" onPress={() => router.push('/full/payments')}>
            Add money
          </Pill>
        </View>
        <View style={{ flex: 1.1 }}>
          <Pill small dense icon={Upload} tone="pale" onPress={() => router.push('/full/payments')}>
            Upload
          </Pill>
        </View>
      </View>
      {helper ? (
        pending ? (
          <Pressable
            onPress={() => router.push('/full/requests')}
            style={{ backgroundColor: c.yellow, borderRadius: 24, padding: 20, gap: 8 }}
          >
            <Clock3 size={24} color={c.yellowText} strokeWidth={1.8} />
            <Copy bold size={18} color={c.yellowText}>
              {pending} {pending === 1 ? 'request needs' : 'requests need'} your answer
            </Copy>
            <Copy size={14} color={c.yellowText}>
              Review transfer
            </Copy>
          </Pressable>
        ) : (
          <DashedCard
            title="Family protection"
            icon={ShieldCheck}
            compact
            onPress={() => router.push('/full/family')}
          />
        )
      ) : null}
      <Pressable
        onPress={() => router.push('/onboarding')}
        style={{
          backgroundColor: c.yellow,
          borderRadius: 24,
          padding: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <IconCircle icon={CreditCard} size={44} background={c.yellowText} color={c.yellow} />
        <View style={{ flex: 1 }}>
          <Copy bold size={20} color={c.yellowText}>
            Start using Wise now
          </Copy>
          <Copy size={13} color={c.yellowText}>
            A world of money, all in one place.
          </Copy>
        </View>
        <ChevronRight size={20} color={c.yellowText} />
      </Pressable>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <SmallCard
              title="Add a currency"
              icon={Wallet}
              onPress={() => router.push('/full/payments')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SmallCard
              title="Spend and withdraw abroad"
              icon={CreditCard}
              onPress={() => router.push('/full/cards')}
            />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <SmallCard
              title="Get account details"
              icon={Landmark}
              onPress={() => router.push('/full/payments')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SmallCard
              title="Your returns"
              icon={TrendingUp}
              onPress={() => router.push('/full/payments')}
            />
          </View>
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <Copy size={22} bold>
          Explore
        </Copy>
        <Pressable
          onPress={() => router.push('/onboarding')}
          style={{ backgroundColor: c.forest, borderRadius: 24, padding: 22, gap: 15 }}
        >
          <Gift size={32} color={c.green} strokeWidth={1.8} />
          <Copy size={22} bold color={c.green}>
            Good things come{'\n'}from sharing.
          </Copy>
          <Copy size={14} color={c.pale}>
            Invite friends to Wise
          </Copy>
        </Pressable>
      </View>
      <DashedCard
        title="Wise Business"
        icon={Landmark}
        compact
        onPress={() => router.push('/onboarding')}
      />
    </Screen>
  );
}
function SmallCard({
  title,
  icon: Icon,
  onPress,
}: {
  title: string;
  icon: typeof Wallet;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: c.border,
        borderRadius: 22,
        padding: 16,
        minHeight: 160,
        justifyContent: 'space-between',
        gap: 14,
      }}
    >
      <IconCircle icon={Icon} plus size={44} />
      <Copy size={16} bold color={c.forest}>
        {title}
      </Copy>
    </Pressable>
  );
}
