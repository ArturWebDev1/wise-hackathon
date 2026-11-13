import { useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ArrowUpRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Heading,
  Copy,
  Pill,
  Calculator,
  Avatar,
  GreyCard,
  ErrorCopy,
} from '@/components/wise';
import { useWise, money } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';

export default function SendMaria() {
  const [value, setValue] = useState('50');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);
  const sendToMaria = useWise((s) => s.sendToMaria);
  const amount = Math.round(Number(value.replace(',', '.')) * 100) / 100;
  const next = () => {
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter an amount greater than zero.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError('');
    setConfirming(true);
  };
  const send = async () => {
    if (submitted.current) return;
    submitted.current = true;
    setBusy(true);
    try {
      const id = await sendToMaria(amount);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/result', params: { id } });
    } catch (e) {
      submitted.current = false;
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Could not send this demo transfer. Try again.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          <Copy size={14} color={c.muted} style={{ textAlign: 'center' }}>
            Demo only — no real money moves.
          </Copy>
          <Pill icon={ArrowUpRight} onPress={confirming ? () => void send() : next} loading={busy}>
            {confirming ? `Send ${money(amount)}` : 'Continue'}
          </Pill>
          <Pill
            small
            tone="white"
            disabled={busy}
            onPress={() => {
              if (busy) return;
              if (confirming) {
                setConfirming(false);
                setError('');
              } else router.dismissTo('/');
            }}
          >
            {confirming ? 'Back' : 'Cancel'}
          </Pill>
        </View>
      }
    >
      <Heading>{confirming ? 'Ready to send?' : 'How much to Maria?'}</Heading>
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <Avatar initials="MA" />
        <View style={{ flex: 1 }}>
          <Copy bold>Maria</Copy>
          <Copy size={16} color={c.muted}>
            Mom
          </Copy>
        </View>
      </View>
      {confirming ? (
        <GreyCard>
          <Copy size={16} color={c.muted}>
            Nikita sends
          </Copy>
          <Copy size={36} bold>
            {money(amount, true)}
          </Copy>
          <Copy size={18}>Maria receives {money(amount, true)}</Copy>
        </GreyCard>
      ) : (
        <Calculator
          value={value}
          onChange={(v) => {
            setValue(v);
            setError('');
          }}
          error={error}
        />
      )}
      {confirming && error ? <ErrorCopy>{error}</ErrorCopy> : null}
    </Screen>
  );
}
