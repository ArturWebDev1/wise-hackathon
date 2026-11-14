import { useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Hourglass, Check, ShieldCheck, CircleAlert, ArrowUpRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Screen, Statement, Heading, Copy, Pill, IconCircle, Empty } from '@/components/wise';
import { useWise, money, type Transfer } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { LitePendingResult } from '@/features/lite/lite-pending-result';

export default function Result() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transfer = useWise((s) => s.transfers.find((t) => t.id === id));
  const ready = useWise((s) => s.ready);
  const role = useWise((s) => s.role);
  const previous = useRef(transfer?.status);
  useEffect(() => {
    if (previous.current === 'pending' && transfer?.status !== 'pending')
      void Haptics.notificationAsync(
        transfer?.status === 'approved'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
    previous.current = transfer?.status;
  }, [transfer?.status]);
  if (!ready)
    return (
      <Screen safe footer={<Pill onPress={() => router.dismissTo('/')}>Back home</Pill>}>
        <Copy>Checking your transfer…</Copy>
      </Screen>
    );
  if (!transfer)
    return (
      <Screen safe>
        <Empty icon={ArrowUpRight} action="Back home" onPress={() => router.dismissTo('/')}>
          This transfer isn’t available.
        </Empty>
      </Screen>
    );
  if (transfer.status === 'pending' && role === 'maria')
    return <LitePendingResult transfer={transfer} />;
  const copy = resultCopy(transfer, role === 'nikita');
  const success = copy.kind === 'success';
  const blocked = copy.kind === 'blocked';
  return (
    <Screen
      safe
      color={success ? c.green : blocked ? c.danger : c.white}
      footer={
        <Pill tone="dark" onPress={() => router.dismissTo('/')}>
          Back home
        </Pill>
      }
      style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 48, gap: 24 }}
    >
      <IconCircle
        icon={ICONS[copy.kind]}
        background={success ? c.forest : blocked ? c.text : c.pale}
        color={success ? c.green : blocked ? c.danger : c.forest}
        size={88}
      />
      {success || blocked ? (
        <Statement color={blocked ? c.text : c.forest} size={copy.title.length > 8 ? 48 : 72}>
          {copy.title}
        </Statement>
      ) : (
        <Heading center>{copy.title}</Heading>
      )}
      <Copy
        size={success || blocked ? 22 : 20}
        bold={!success && !blocked}
        color={success ? c.forest : undefined}
        style={{ textAlign: 'center' }}
      >
        {copy.summary}
      </Copy>
      {copy.detail ? (
        <Copy
          size={16}
          bold={blocked}
          color={success ? c.forest : blocked ? undefined : c.muted}
          style={{ textAlign: 'center' }}
        >
          {copy.detail}
        </Copy>
      ) : null}
    </Screen>
  );
}

type ResultKind = 'success' | 'blocked' | 'waiting' | 'declined';
const ICONS = { success: Check, blocked: CircleAlert, waiting: Hourglass, declined: ShieldCheck };

function resultCopy(
  transfer: Transfer,
  helperView: boolean,
): {
  kind: ResultKind;
  title: string;
  summary: string;
  detail: string;
} {
  const amount = money(transfer.amount);
  const name = transfer.recipient.name;
  switch (transfer.status) {
    case 'sent':
      return transfer.direction === 'incoming'
        ? {
            kind: 'success',
            title: helperView ? 'SENT!' : 'RECEIVED!',
            summary: `${amount} from ${transfer.sender?.name ?? 'Nikita'} to Maria`,
            detail: 'Demo only. No real money moves.',
          }
        : {
            kind: 'success',
            title: 'SENT!',
            summary: `${name} gets ${amount} in seconds`,
            detail: '',
          };
    case 'approved':
      return {
        kind: 'success',
        title: 'APPROVED.\nSENT!',
        summary: `${name} gets ${amount} in seconds`,
        detail: '',
      };
    case 'pending':
      return {
        kind: 'waiting',
        title: 'Waiting for Nikita to approve',
        summary: `${amount} to ${name}`,
        detail:
          'Your money is safe while you wait. If Nikita doesn’t answer within 12 hours, this transfer is cancelled.',
      };
    case 'blocked':
      return {
        kind: 'blocked',
        title: 'STOP.\nTHIS MAY\nBE A SCAM.',
        summary: 'Banks and police never ask you to move money.',
        detail: 'Your money is safe. Nikita knows.',
      };
    default:
      return {
        kind: 'declined',
        title: transfer.expired ? 'Expired.' : 'Declined.',
        summary: 'Your money is safe.',
        detail: '',
      };
  }
}
