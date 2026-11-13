import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Bell, Phone, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Copy,
  Heading,
  Pill,
  GreyCard,
  Avatar,
  StatusChip,
  ErrorCopy,
  Empty,
  callPerson,
} from '@/components/wise';
import { useWise, money } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';

export default function Approval() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transfer = useWise((s) => s.transfers.find((t) => t.id === id));
  const decide = useWise((s) => s.decide);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const answer = async (approve: boolean) => {
    setBusy(true);
    setError('');
    try {
      await decide(id, approve);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your answer wasn’t saved. Try again.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  };
  if (!transfer)
    return (
      <Screen>
        <Empty icon={ShieldCheck} action="Back home" onPress={() => router.dismissTo('/')}>
          This request isn’t available.
        </Empty>
      </Screen>
    );
  const pending = transfer.status === 'pending';
  return (
    <Screen
      footer={
        pending ? (
          <View style={{ gap: 12 }}>
            <Pill onPress={() => void answer(true)} loading={busy}>
              Approve
            </Pill>
            <Pill tone="danger" onPress={() => void answer(false)} disabled={busy}>
              Decline
            </Pill>
            <Pill small tone="pale" icon={Phone} onPress={() => callPerson(true)}>
              Call Mom
            </Pill>
          </View>
        ) : (
          <Pill
            tone="dark"
            onPress={() => {
              useWise.getState().setRole('nikita');
              router.dismissTo('/');
            }}
          >
            Back home
          </Pill>
        )
      }
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: c.card,
          borderRadius: 20,
          padding: 16,
        }}
      >
        <Bell size={24} color={c.forest} strokeWidth={1.8} />
        <View style={{ flex: 1 }}>
          <Copy bold size={14}>
            Wise · Trusted Helper
          </Copy>
          <Copy size={13} color={c.muted}>
            {pending
              ? 'Mom needs your help with a transfer'
              : transfer.status === 'blocked'
                ? 'Scam Pause blocked a transfer'
                : 'Transfer update'}
          </Copy>
        </View>
      </View>
      <Heading compact>
        {pending
          ? `Mom wants to send ${money(transfer.amount)} to ${transfer.isNew ? 'a NEW person' : transfer.recipient.name}${transfer.isNew ? `: “${transfer.recipient.name}”` : ''}`
          : transfer.status === 'blocked'
            ? 'Mom’s transfer was blocked.'
            : transfer.status === 'declined'
              ? transfer.expired
                ? 'Transfer expired'
                : 'Transfer declined'
              : 'Transfer sent.'}
      </Heading>
      <GreyCard style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Avatar initials={transfer.recipient.initials} />
          <View style={{ flex: 1 }}>
            <Copy size={18} bold>
              {transfer.recipient.name}
            </Copy>
            <Copy size={16} color={c.muted}>
              {money(transfer.amount)}
            </Copy>
          </View>
        </View>
        <StatusChip status={transfer.status} />
        {transfer.recipient.iban ? (
          <Copy size={14} color={c.muted}>
            {transfer.recipient.iban}
          </Copy>
        ) : null}
      </GreyCard>
      <View style={{ gap: 10, alignItems: 'flex-start' }}>
        {transfer.isNew ? <Flag>New person</Flag> : null}
        {transfer.aboveLimit ? (
          <Flag>{`Above ${money(transfer.limitAtCreation ?? 300)} limit`}</Flag>
        ) : null}
        {transfer.pressured ? <Flag>Mom said someone is calling her</Flag> : null}
      </View>
      {transfer.status === 'blocked' ? (
        <Copy size={17}>Don’t approve this transfer. Call Mom and check she’s safe.</Copy>
      ) : pending ? (
        <Copy size={16} color={c.muted}>
          Only approve if you recognise this person and have checked with Mom.
        </Copy>
      ) : (
        <Copy size={17}>
          {transfer.status === 'declined'
            ? 'Mom’s money stays with her. Maria can see your answer now.'
            : 'Maria can see this transfer update.'}
        </Copy>
      )}
      {error ? <ErrorCopy>{error}</ErrorCopy> : null}
      {!pending ? (
        <Pill small tone="pale" icon={Phone} onPress={() => callPerson(true)}>
          Call Mom
        </Pill>
      ) : null}
    </Screen>
  );
}
function Flag({ children }: { children: string }) {
  return (
    <View
      style={{
        backgroundColor: c.dangerPale,
        borderRadius: 99,
        paddingHorizontal: 14,
        paddingVertical: 9,
        maxWidth: '100%',
      }}
    >
      <Copy size={14} bold color={c.dangerText}>
        {children}
      </Copy>
    </View>
  );
}
