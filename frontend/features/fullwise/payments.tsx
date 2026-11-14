import { Pressable, View } from 'react-native';
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
import { openDemo } from '@/features/helper/demo';
import { FullPage, RingAvatar, WiseCard, ink, openSend, useIsHelper } from './parts';

function ActionPill({
  children,
  green = false,
  onPress,
}: {
  children: string;
  green?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
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
    </Pressable>
  );
}

export function FullPayments() {
  const helper = useIsHelper();
  return (
    <FullPage>
      <View style={{ height: 25 }} />
      <Copy bold size={28} color={ink} style={{ lineHeight: 32, letterSpacing: -1.2 }}>
        Payments
      </Copy>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ActionPill green onPress={() => openSend(helper)}>
          Send
        </ActionPill>
        <ActionPill onPress={() => openDemo('Request money')}>Request</ActionPill>
      </View>
      <View style={{ gap: 11 }}>
        <WiseCard
          title="Scheduled transfers"
          text="Set up a transfer to send at a later date."
          icon={CalendarClock}
          chevron
          onPress={() => openDemo('Scheduled transfers')}
        />
        <WiseCard
          title="Direct Debits"
          text="Set up and manage regular payments."
          icon={RefreshCw}
          chevron
          onPress={() => openDemo('Direct Debits')}
        />
        <WiseCard
          title="Recurring card payments"
          text="Manage your repeated card transactions."
          icon={RotateCw}
          chevron
          onPress={() => openDemo('Recurring card payments')}
        />
        <WiseCard
          title="Payment requests"
          text="Create and manage payments you've requested."
          icon={Banknote}
          chevron
          onPress={() => openDemo('Payment requests')}
        />
        <WiseCard
          title="Forward invoices to email"
          text="Save time by emailing bills and invoices to create draft payments."
          icon={Mail}
          chevron
          onPress={() => openDemo('Forward invoices')}
        />
        <WiseCard
          title="Bill splits"
          text="Split transactions with multiple people."
          icon={Split}
          chevron
          onPress={() => openDemo('Bill splits')}
        />
      </View>
      <Copy bold size={24} color={ink} style={{ lineHeight: 28, letterSpacing: -1, marginTop: 6 }}>
        Payment tools
      </Copy>
      <View style={{ gap: 11 }}>
        <Pressable onPress={() => openDemo('Your Wisetag')} accessibilityRole="button">
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
            <RingAvatar initials={helper ? 'NG' : 'MA'} />
            <View style={{ flex: 1, gap: 3 }}>
              <Copy bold size={15} color={ink}>
                Your Wisetag
              </Copy>
              <Copy size={15} color="#4A4A47">
                {helper ? '@nikita1147' : '@maria1147'}
              </Copy>
            </View>
          </View>
        </Pressable>
        <WiseCard
          title="Send via link"
          text="Create and manage links for recipients to claim money."
          icon={Link}
          chevron
          onPress={() => openDemo('Send via link')}
        />
        <WiseCard
          title="Auto Conversions"
          text="Convert money between currencies automatically at your chosen rate."
          icon={TrendingUp}
          chevron
          onPress={() => openDemo('Auto Conversions')}
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
