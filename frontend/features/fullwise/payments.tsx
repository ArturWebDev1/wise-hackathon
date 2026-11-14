import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Banknote,
  CalendarClock,
  Link,
  Mail,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  Split,
  TrendingUp,
} from 'lucide-react-native';
import { Copy } from '@/components/wise';
import { wise as c } from '@/lib/wise-theme';
import { accountFor, useWise } from '@/lib/wise-store';
import { FullPage, RingAvatar, Tap, WiseCard, ink, useIsHelper } from './parts';

function ActionPill({
  children,
  green = false,
  onPress,
}: {
  children: string;
  green?: boolean;
  onPress?: () => void;
}) {
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="button"
      style={{
        backgroundColor: green ? c.green : c.pale,
        borderRadius: 69,
        paddingHorizontal: 18,
        paddingVertical: 10,
      }}
    >
      <Copy bold size={15} color={c.forest}>
        {children}
      </Copy>
    </Tap>
  );
}

export function FullPayments() {
  const helper = useIsHelper();
  const role = useWise((s) => s.role);
  return (
    <FullPage>
      <View style={{ height: 25 }} />
      <Copy bold size={28} color={ink} style={{ lineHeight: 32, letterSpacing: -1.2 }}>
        Payments
      </Copy>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ActionPill green>
          Send
        </ActionPill>
        <ActionPill>Request</ActionPill>
      </View>
      <View style={{ gap: 11 }}>
        <WiseCard
          title="Scheduled transfers"
          text="Set up a transfer to send at a later date."
          icon={CalendarClock}
          chevron
        />
        <WiseCard
          title="Direct Debits"
          text="Set up and manage regular payments."
          icon={RefreshCw}
          chevron
        />
        <WiseCard
          title="Recurring card payments"
          text="Manage your repeated card transactions."
          icon={RotateCw}
          chevron
        />
        <WiseCard
          title="Payment requests"
          text="Create and manage payments you've requested."
          icon={Banknote}
          chevron
        />
        <WiseCard
          title="Forward invoices to email"
          text="Save time by emailing bills and invoices to create draft payments."
          icon={Mail}
          chevron
        />
        <WiseCard
          title="Bill splits"
          text="Split transactions with multiple people."
          icon={Split}
          chevron
        />
      </View>
      <Copy bold size={24} color={ink} style={{ lineHeight: 28, letterSpacing: -1, marginTop: 6 }}>
        Payment tools
      </Copy>
      <View style={{ gap: 11 }}>
        <Tap accessibilityRole="button">
          <View
            style={{
              backgroundColor: '#F0F0EC',
              borderRadius: 20,
              padding: 15,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <RingAvatar initials={accountFor(role).initials} />
            <View style={{ flex: 1, gap: 3 }}>
              <Copy bold size={15} color={ink}>
                Your Wisetag
              </Copy>
              <Copy size={15} color="#4A4A47">
                @yourwisetag
              </Copy>
            </View>
          </View>
        </Tap>
        <WiseCard
          title="Send via link"
          text="Create and manage links for recipients to claim money."
          icon={Link}
          chevron
        />
        <WiseCard
          title="Auto Conversions"
          text="Convert money between currencies automatically at your chosen rate."
          icon={TrendingUp}
          chevron
        />
        {helper ? (
          <WiseCard
            title="Family protection"
            text="Protect your family from scams and approve their risky transfers."
            icon={ShieldCheck}
            chevron
            onPress={() => router.push('/family-protection')}
          />
        ) : null}
      </View>
    </FullPage>
  );
}
