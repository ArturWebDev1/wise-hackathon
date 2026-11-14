import { useState } from 'react';
import { View, Share, Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import { Share2, MessageCircle, Send, MessageSquare, Link, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Heading,
  Copy,
  Row,
  Pill,
  GreyCard,
  Avatar,
  ErrorCopy,
  WiseMark,
  Empty,
} from '@/components/wise';
import { useWise, recipients, money, type Recipient } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { LiteAmountInput } from '@/features/lite/lite-amount-input';

export default function RequestMoney() {
  return (
    <RequestMoneyContent />
  );
}

function RequestMoneyContent() {
  const favourites = useWise((s) => s.favouriteIds);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [value, setValue] = useState('50');
  const [stage, setStage] = useState<'who' | 'amount' | 'share'>('who');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);
  const amount = Math.round(Number(value.replace(',', '.')) * 100) / 100;
  const link = `https://example.com/wise-lite/request/maria1147?amount=${amount}`;
  const message = `Hi ${recipient?.name}, Maria is asking for ${money(amount)}. Wise Lite hackathon demo — no real money. ${link}`;
  const next = () => {
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter an amount greater than zero.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setStage('share');
  };
  const share = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await Share.share({ message, title: `Request ${money(amount)} for Maria` });
      if (result.action === Share.sharedAction) {
        setShared(true);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setError('The link couldn’t be shared. Try again.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  };
  const shareApp = async (app: 'whatsapp' | 'telegram' | 'sms') => {
    const encoded = encodeURIComponent(message);
    const url =
      app === 'whatsapp'
        ? `https://wa.me/?text=${encoded}`
        : app === 'telegram'
          ? `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encoded}`
          : `sms:${Platform.OS === 'ios' ? '&' : '?'}body=${encoded}`;
    try {
      await Linking.openURL(url);
      setShared(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError('That app couldn’t open. Try Share link instead.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  if (stage === 'who')
    return (
      <Screen>
        <Heading>Who do you want to ask?</Heading>
        <View>
          {recipients
            .filter((r) => favourites.includes(r.id))
            .map((r) => (
              <Row
                key={r.id}
                initials={r.initials}
                badge
                title={r.name}
                subtitle={r.relationship}
                onPress={() => {
                  setRecipient(r);
                  setStage('amount');
                }}
              />
            ))}
          {!favourites.length ? (
            <Empty icon={Users} action="Choose favourites" onPress={() => router.push('/rules')}>
              Add someone to ask for money.
            </Empty>
          ) : null}
        </View>
      </Screen>
    );
  if (stage === 'amount')
    return (
      <Screen
        footer={
          <View style={{ gap: 12 }}>
            <Pill onPress={next}>Continue</Pill>
            <Pill
              tone="white"
              onPress={() => {
                setStage('who');
                setError('');
              }}
            >
              Back
            </Pill>
          </View>
        }
      >
        <Heading>How much from {recipient?.name}?</Heading>
        <LiteAmountInput
          value={value}
          label="You request"
          hint="Demo request · No money moves here"
          onChange={(v) => {
            setValue(v);
            setError('');
          }}
          error={error}
        />
      </Screen>
    );
  return (
    <Screen
      footer={
        <View style={{ gap: 12 }}>
          <Pill
            icon={Share2}
            onPress={() => {
              void share();
            }}
            loading={busy}
          >
            {shared ? 'Share again' : 'Share link'}
          </Pill>
          {shared ? (
            <Pill tone="dark" onPress={() => router.dismissTo('/')} disabled={busy}>
              Done
            </Pill>
          ) : (
            <Pill
              tone="white"
              disabled={busy}
              onPress={() => {
                setStage('amount');
                setError('');
              }}
            >
              Back
            </Pill>
          )}
        </View>
      }
    >
      <Heading>
        {shared ? 'Your link is ready.' : `Ask ${recipient?.name} for ${money(amount)}`}
      </Heading>
      <GreyCard style={{ alignItems: 'center', paddingVertical: 30, gap: 16 }}>
        <WiseMark size={30} />
        <Avatar initials="MA" size={72} />
        <Copy size={26} bold>
          @maria1147
        </Copy>
        <Copy size={40} bold>
          {money(amount)}
        </Copy>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Link size={18} color={c.forest} />
          <Copy size={14} color={c.forest}>
            Maria’s request link
          </Copy>
        </View>
      </GreyCard>
      <View style={{ gap: 12 }}>
        <Pill
          tone="pale"
          icon={MessageCircle}
          onPress={() => {
            void shareApp('whatsapp');
          }}
        >
          WhatsApp
        </Pill>
        <Pill
          tone="pale"
          icon={Send}
          onPress={() => {
            void shareApp('telegram');
          }}
        >
          Telegram
        </Pill>
        <Pill
          tone="white"
          icon={MessageSquare}
          onPress={() => {
            void shareApp('sms');
          }}
        >
          SMS
        </Pill>
      </View>
      {error ? <ErrorCopy>{error}</ErrorCopy> : null}
      {shared ? (
        <Pill
          small
          tone="white"
          disabled={busy}
          onPress={() => {
            setStage('amount');
            setShared(false);
            setError('');
          }}
        >
          Change amount
        </Pill>
      ) : null}
      <Copy size={14} color={c.muted}>
        This is a demo link. It can’t collect real money.
      </Copy>
    </Screen>
  );
}
