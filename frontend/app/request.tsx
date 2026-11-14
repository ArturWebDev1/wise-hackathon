import { useState } from 'react';
import { View, Share } from 'react-native';
import { router } from 'expo-router';
import { Share2, Link, Users } from 'lucide-react-native';
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
  Empty,
} from '@/components/wise';
import { useWise, useAccount, money, type Recipient } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { LiteAmountInput } from '@/features/lite/lite-amount-input';

export default function RequestMoney() {
  return (
    <RequestMoneyContent />
  );
}

function RequestMoneyContent() {
  const requestPeople = useWise((s) => s.requestPeople);
  const ready = useWise((s) => s.ready);
  const account = useAccount();
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [value, setValue] = useState('50');
  const [stage, setStage] = useState<'who' | 'amount' | 'share'>('who');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);
  const amount = Math.round(Number(value.replace(',', '.')) * 100) / 100;
  const link = `https://example.com/wise-lite/request/${encodeURIComponent(account.wiseId)}?amount=${amount}`;
  const message = `Hi ${recipient?.name}, ${account.name} is asking for ${money(amount)}. Wise Care hackathon demo — no real money. ${link}`;
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
      const result = await Share.share({ message, title: `Request ${money(amount)} for ${account.name}` });
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
  const recipientRemoved =
    !shared && recipient !== null && !requestPeople.some((person) => person.id === recipient.id);

  if (stage === 'who' || recipientRemoved)
    return (
      <Screen>
        <Heading>Who do you want to ask?</Heading>
        <View>
          {recipientRemoved ? <ErrorCopy>This person is no longer on your list.</ErrorCopy> : null}
          {requestPeople.map((r) => (
            <Row
              key={r.id}
              initials={r.initials}
              badge
              title={r.name}
              subtitle={r.relationship}
              onPress={() => {
                setRecipient(r);
                setError('');
                setStage('amount');
              }}
            />
          ))}
          {!ready ? <Copy>Loading your list…</Copy> : null}
          {ready && !requestPeople.length ? (
            <Empty icon={Users} action="Back home" onPress={() => router.dismissTo('/')}>
              Nikita hasn’t added anyone you can ask for money yet.
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
          <Pill icon={Share2} onPress={() => void share()} loading={busy}>
            {shared ? 'Share again' : 'Share'}
          </Pill>
          {shared ? (
            <Pill tone="dark" onPress={() => router.dismissTo('/')} disabled={busy}>
              Done
            </Pill>
          ) : null}
        </View>
      }
    >
      <Heading>{shared ? 'Your link is ready.' : `Ask ${recipient?.name} for ${money(amount)}`}</Heading>
      <GreyCard style={{ padding: 24, gap: 20, alignItems: 'center' }}>
        <Avatar initials={account.initials} size={64} badge background={c.white} />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Copy size={20} bold>
            {account.name}
          </Copy>
          <Copy size={15} color={c.muted}>
            {`@${account.wiseId}`}
          </Copy>
        </View>
        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: c.border }} />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Copy size={15} color={c.muted}>
            is requesting
          </Copy>
          <Copy size={48} bold style={{ letterSpacing: -1.5 }}>
            {money(amount)}
          </Copy>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Link size={18} color={c.forest} />
          <Copy size={15} color={c.forest}>
            Request link
          </Copy>
        </View>
      </GreyCard>
      {error ? <ErrorCopy>{error}</ErrorCopy> : null}
      <Copy size={14} color={c.muted}>
        Demo link. No real money.
      </Copy>
    </Screen>
  );
}
