import { useState } from 'react';
import type { ReactElement } from 'react';
import { Image, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowDownUp,
  ArrowUp,
  BellRing,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  ChartNoAxesColumnIncreasing,
  Eye,
  EyeOff,
  Globe,
  Landmark,
  ScanLine,
  Shield,
  X,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Copy, EUFlag } from '@/components/wise';
import { useWise } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { RateChart } from './chart';
import { CardNotchIcon } from './icons';
import {
  FullPage,
  HomeHeader,
  RingIcon,
  WiseCard,
  dashed,
  ink,
  rowBg,
  Tap,
  useIsHelper,
} from './parts';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- bundled image, no module typing in this project
const shareWise: number = require('./images/share-wise.jpg');

function H({ children }: { children: string }) {
  return (
    <Copy bold size={24} style={{ lineHeight: 28, letterSpacing: -1 }} color={ink}>
      {children}
    </Copy>
  );
}

function ActionPill({
  children,
  tone = 'pale',
  icon: Icon,
  onPress,
}: {
  children: string;
  tone?: 'green' | 'pale';
  icon?: LucideIcon;
  onPress?: () => void;
}) {
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: tone === 'green' ? c.green : c.pale,
        borderRadius: 69,
        paddingHorizontal: 17,
        paddingVertical: 10,
      }}
    >
      {Icon ? <Icon size={15} color={c.forest} strokeWidth={1.8} /> : null}
      <Copy bold size={15} color={c.forest}>
        {children}
      </Copy>
    </Tap>
  );
}

function SmallPill({
  children,
  tone,
  onPress,
}: {
  children: string;
  tone: 'green' | 'white';
  onPress?: () => void;
}) {
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="button"
      style={{
        backgroundColor: tone === 'green' ? c.green : c.white,
        borderRadius: 69,
        paddingHorizontal: 17,
        paddingVertical: 10,
      }}
    >
      <Copy bold size={14} color={c.forest}>
        {children}
      </Copy>
    </Tap>
  );
}

function Task({
  icon,
  title,
  text,
  primary,
  onPrimary,
  secondary,
  onSecondary,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  primary: string;
  onPrimary?: () => void;
  secondary?: string;
  onSecondary?: () => void;
}) {
  return (
    <View
      style={{ backgroundColor: '#EDEEEA', borderRadius: 22, padding: 15, flexDirection: 'row', gap: 13 }}
    >
      <RingIcon icon={icon} />
      <View style={{ flex: 1, gap: 6 }}>
        <Copy bold size={16} color={c.forest}>
          {title}
        </Copy>
        <Copy size={13} color="#4A4A47">
          {text}
        </Copy>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          <SmallPill tone="green" onPress={onPrimary}>
            {primary}
          </SmallPill>
          {secondary && onSecondary ? (
            <SmallPill tone="white" onPress={onSecondary}>
              {secondary}
            </SmallPill>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function CloseButton({ onPress, dark = false }: { onPress?: () => void; dark?: boolean }) {
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel="Dismiss"
      style={{
        position: 'absolute',
        top: 11,
        right: 11,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: dark ? '#2B2C28' : '#CFE5E4',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <X size={18} color={dark ? '#F2F4EF' : ink} strokeWidth={1.8} />
    </Tap>
  );
}

function Currency({ amount, code, flag }: { amount: string; code: string; flag: ReactElement }) {
  return (
    <View
      style={{
        backgroundColor: c.white,
        borderRadius: 21,
        paddingHorizontal: 17,
        paddingVertical: 17,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Copy bold size={28} color={ink} style={{ letterSpacing: -1 }}>
        {amount}
      </Copy>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        {flag}
        <Copy bold size={24} color={c.forest}>
          {code}
        </Copy>
        <ChevronDown size={17} color={c.forest} strokeWidth={1.8} />
      </View>
    </View>
  );
}

function UsFlag() {
  return (
    <View style={{ width: 21, height: 21, borderRadius: 10, overflow: 'hidden' }}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? '#FFFFFF' : '#C8242F' }} />
      ))}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 10,
          height: 11,
          backgroundColor: '#2A3E8C',
        }}
      />
    </View>
  );
}

export function FullHome() {
  const helper = useIsHelper();
  const balance = useWise((s) => s.balance);
  const [showBalance, setShowBalance] = useState(false);
  const pending = useWise(
    (s) => s.transfers.filter(
      (t) => t.direction === 'outgoing' && t.status === 'pending' && !t.expired,
    ).length,
  );
  const [hideSend, setHideSend] = useState(false);
  const [hideCard, setHideCard] = useState(false);
  const [hideShare, setHideShare] = useState(false);
  return (
    <FullPage header={<HomeHeader />}>
      {helper && pending > 0 ? (
        <View accessibilityLiveRegion="polite">
          <Tap
            onPress={() => router.push('/family-requests')}
            accessibilityLabel={`${pending} ${pending === 1 ? 'request' : 'requests'} waiting for your approval. Review requests.`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              minHeight: 72,
              borderRadius: 20,
              backgroundColor: c.yellow,
            }}
          >
            <BellRing size={24} color={c.yellowText} strokeWidth={1.8} />
            <View style={{ flex: 1, gap: 3 }}>
              <Copy bold size={17} color={c.yellowText}>
                {`${pending} ${pending === 1 ? 'request' : 'requests'} waiting`}
              </Copy>
              <Copy size={14} color={c.yellowText}>
                Review and approve transfers
              </Copy>
            </View>
            <ChevronRight size={20} color={c.yellowText} strokeWidth={2} />
          </Tap>
        </View>
      ) : null}
      <View style={{ gap: 6 }}>
        <Copy size={20} color={ink}>
          Total balance
        </Copy>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Copy bold size={32} color={ink} style={{ lineHeight: 40, letterSpacing: -1 }}>
            {showBalance
              ? `${new Intl.NumberFormat('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(balance)} EUR`
              : '**** EUR'}
          </Copy>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Tap
              onPress={() => setShowBalance((shown) => !shown)}
              accessibilityLabel={showBalance ? 'Hide balance' : 'Show balance'}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: c.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {showBalance ? (
                <EyeOff size={22} color={c.forest} strokeWidth={2} />
              ) : (
                <Eye size={22} color={c.forest} strokeWidth={2} />
              )}
            </Tap>
            <View
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: c.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChartNoAxesColumnIncreasing size={24} color={c.forest} strokeWidth={2} />
            </View>
          </View>
        </View>
      </View>

      <H>Welcome to Wise</H>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <ActionPill tone="green">
          Send
        </ActionPill>
        <ActionPill>Add money</ActionPill>
        <ActionPill icon={ScanLine}>
          Upload
        </ActionPill>
      </View>
      <View style={{ gap: 11 }}>
        <WiseCard
          title="Add a currency to your account"
          icon={Globe}
        />
        <WiseCard
          title="Spend and withdraw abroad"
          icon={CardNotchIcon}
        />
        <WiseCard
          title="Get account details to get paid"
          icon={Landmark}
        />
      </View>

      <H>Tasks</H>
      {hideSend ? null : (
        <Task
          icon={ArrowUp}
          title="Still need to send 0.01 EUR?"
          text="We've saved your transfer details so you can jump back in."
          primary="Check details"
                    secondary="Dismiss"
          onSecondary={() => setHideSend(true)}
        />
      )}
      {hideCard ? null : (
        <View style={{ backgroundColor: '#DFF4F5', borderRadius: 22, padding: 15, gap: 13 }}>
          <CloseButton onPress={() => setHideCard(true)} />
          <View style={{ flexDirection: 'row', gap: 13, paddingRight: 28 }}>
            <RingIcon icon={CreditCard} />
            <View style={{ flex: 1, gap: 6 }}>
              <Copy bold size={16} color={ink}>
                Get a Wise card
              </Copy>
              <Copy size={13} color="#3B3B38">
                Spend straight from your Wise account, at home and abroad.
              </Copy>
            </View>
          </View>
          <Tap
            accessibilityRole="button"
            style={{
              backgroundColor: '#04504E',
              borderRadius: 69,
              minHeight: 45,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Copy bold size={15} color={c.white}>
              Order card
            </Copy>
          </Tap>
        </View>
      )}

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <H>Your returns</H>
          <Tap>
            <Copy bold size={15} color={c.forest} style={{ textDecorationLine: 'underline' }}>
              Explore
            </Copy>
          </Tap>
        </View>
        <Copy size={15} color="#4A4A47">
          Provided by Wise Assets Europe
        </Copy>
      </View>
      <Tap accessibilityRole="button">
        <View
          style={{
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: dashed,
            borderRadius: 20,
            backgroundColor: rowBg,
            padding: 17,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View style={{ width: 45, height: 45, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ transform: [{ scale: 1.9 }] }}>
              <EUFlag />
            </View>
          </View>
          <Copy size={15} color="#3B3B38" style={{ flex: 1 }}>
            Start earning a return on EUR in your Wise account
          </Copy>
          <ChevronRight size={17} color="#6A6C6A" strokeWidth={1.8} />
        </View>
      </Tap>
      <Copy size={13} color="#4A4A47">
        Investment services are provided by Wise Assets Europe AS. Capital at risk. Growth not
        guaranteed.
      </Copy>

      <H>Explore</H>
      {hideShare ? null : (
        <View style={{ borderRadius: 34, overflow: 'hidden', aspectRatio: 1066 / 1148 }}>
          <Image source={shareWise} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <Tap
            onPress={() => setHideShare(true)}
            accessibilityLabel="Dismiss"
            style={{ position: 'absolute', left: '84%', top: '3.5%', width: '12%', aspectRatio: 1 }}
          />
        </View>
      )}

      <H>Transfer calculator</H>
      <View style={{ backgroundColor: c.card, borderRadius: 22, padding: 17, gap: 14 }}>
        <RateChart />
        <Copy bold size={17} color={ink}>
          1 EUR = 1.1022 USD
        </Copy>
        <View>
          <View style={{ gap: 4 }}>
            <Currency amount="1 000" code="EUR" flag={<EUFlag />} />
            <Currency amount="1 095,36" code="USD" flag={<UsFlag />} />
          </View>
          <View
            style={{
              position: 'absolute',
              alignSelf: 'center',
              top: '50%',
              marginTop: -18,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#E6E7E2',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowDownUp size={18} color={c.forest} strokeWidth={1.8} />
          </View>
        </View>
        <View
          style={{
            borderWidth: 1.5,
            borderColor: '#D5D5D0',
            borderRadius: 20,
            flexDirection: 'row',
            paddingVertical: 13,
          }}
        >
          <View style={{ flex: 1, alignItems: 'center', gap: 4, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Copy size={13} color="#4A4A47">
                Includes fees
              </Copy>
              <CircleHelp size={15} color={c.forest} strokeWidth={1.8} />
            </View>
            <Copy size={13} color="#4A4A47">
              6.21 EUR
            </Copy>
          </View>
          <View style={{ width: 1.5, backgroundColor: '#D5D5D0' }} />
          <View style={{ flex: 1, alignItems: 'center', gap: 3 }}>
            <Copy size={13} color="#4A4A47">
              Should arrive
            </Copy>
            <Copy size={13} color="#4A4A47" style={{ textAlign: 'center' }}>
              {'By Tuesday 17\nNovember'}
            </Copy>
          </View>
        </View>
        <Tap
          accessibilityRole="button"
          style={{
            backgroundColor: c.green,
            borderRadius: 69,
            minHeight: 49,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Copy bold size={16} color={c.forest}>
            Send
          </Copy>
        </Tap>
      </View>
      <Tap accessibilityRole="button">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <RingIcon icon={BellRing} plus={false} />
          <Copy bold size={17} color={ink} style={{ flex: 1 }}>
            Get exchange rate updates
          </Copy>
          <ChevronRight size={18} color={c.forest} strokeWidth={1.8} />
        </View>
      </Tap>

      <View style={{ alignItems: 'center', gap: 11, paddingVertical: 17 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Shield size={21} color={ink} strokeWidth={1.8} />
          <Copy bold size={18} color={c.forest}>
            Your money, protected
          </Copy>
        </View>
        <Copy size={15} color="#4A4A47" style={{ textAlign: 'center' }}>
          We promise to protect every penny with cutting-edge tech and anytime customer support.
        </Copy>
        <ActionPill>Learn more</ActionPill>
      </View>
    </FullPage>
  );
}
