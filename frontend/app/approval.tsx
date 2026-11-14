import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Check, Phone, ShieldCheck, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Copy,
  Heading,
  Pill,
  GreyCard,
  IconCircle,
  ErrorCopy,
  Empty,
  callPerson,
} from '@/components/wise';
import { useWise, money } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { timeAgo } from '@/features/helper/time-ago';

const noClose = <Stack.Screen options={{ headerRight: () => null }} />;

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
  const backHome = (
    <Pill
      tone="dark"
      onPress={() => {
        useWise.getState().setRole('nikita');
        router.dismissTo('/');
      }}
    >
      Back home
    </Pill>
  );
  if (!transfer)
    return (
      <Screen>
        {noClose}
        <Empty icon={ShieldCheck} action="Back home" onPress={() => router.dismissTo('/')}>
          This request isn’t available.
        </Empty>
      </Screen>
    );
  const pending = transfer.status === 'pending';
  const blocked = transfer.status === 'blocked';
  if (!pending && !blocked) {
    const approved = transfer.status === 'approved';
    const declined = transfer.status === 'declined';
    return (
      <Screen
        safe
        footer={backHome}
        style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 48, gap: 16 }}
      >
        {noClose}
        <IconCircle
          icon={declined ? X : Check}
          size={88}
          background={declined ? c.dangerPale : `${c.green}99`}
          color={declined ? c.dangerText : c.forest}
        />
        <Heading center>
          {declined ? (transfer.expired ? 'Expired.' : 'Declined.') : approved ? 'Approved.' : 'Sent.'}
        </Heading>
        <Copy size={20} bold style={{ textAlign: 'center' }}>
          {`${money(transfer.amount)} to ${transfer.recipient.name}`}
        </Copy>
        <Copy size={17} color={c.muted} style={{ textAlign: 'center' }}>
          {declined
            ? 'Maria’s money is safe.'
            : approved
              ? 'Maria will see it.'
              : 'No approval was needed.'}
        </Copy>
      </Screen>
    );
  }
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
            <CallMom />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <CallMom />
            {backHome}
          </View>
        )
      }
    >
      {noClose}
      <Heading compact>
        {pending
          ? `Mom wants to send ${money(transfer.amount)} to ${transfer.isNew ? 'a NEW person' : transfer.recipient.name}${transfer.isNew ? `: “${transfer.recipient.name}”` : ''}`
          : 'Mom’s transfer was blocked.'}
      </Heading>
      <GreyCard style={{ padding: 20, gap: 12 }}>
        <Detail label="Recipient" value={transfer.recipient.name} bold />
        <Detail label="Amount" value={money(transfer.amount)} bold />
        <Detail label="Requested" value={timeAgo(transfer.createdAt)} />
        {transfer.recipient.iban ? <Detail label="IBAN" value={transfer.recipient.iban} /> : null}
      </GreyCard>
      <View style={{ gap: 10, alignItems: 'flex-start' }}>
        {transfer.isNew ? <Flag>New person</Flag> : null}
        {transfer.aboveLimit ? (
          <Flag>{`Above ${money(transfer.limitAtCreation ?? 300)} limit`}</Flag>
        ) : null}
        {transfer.pressured ? <Flag>Mom said someone is calling her</Flag> : null}
      </View>
      {blocked ? (
        <Copy size={17}>Don’t approve this transfer. Call Mom and check she’s safe.</Copy>
      ) : (
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <ShieldCheck size={24} color={c.forest} strokeWidth={1.8} />
          <Copy size={16} color={c.muted} style={{ flex: 1 }}>
            Approve only if you know this person and have checked with Mom.
          </Copy>
        </View>
      )}
      {error ? <ErrorCopy>{error}</ErrorCopy> : null}
    </Screen>
  );
}
function Detail({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'baseline' }}>
      <Copy size={17} color={c.muted} style={{ width: 110 }}>
        {label}
      </Copy>
      <Copy size={bold ? 18 : 17} bold={bold} style={{ flex: 1 }}>
        {value}
      </Copy>
    </View>
  );
}
function CallMom() {
  return (
    <Pressable
      onPress={() => callPerson(true)}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
      }}
    >
      <Phone size={20} color={c.forest} strokeWidth={1.8} />
      <Copy bold size={18} color={c.forest}>
        Call Mom
      </Copy>
    </Pressable>
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
