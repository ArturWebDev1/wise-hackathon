import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Input, Label } from 'heroui-native';
import {
  ArrowRight,
  Check,
  UserRoundPlus,
  CircleAlert,
  ShieldCheck,
  Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Heading,
  Copy,
  Pill,
  Row,
  DashedCard,
  Avatar,
  Statement,
  IconCircle,
  ErrorCopy,
  Empty,
  styles,
} from '@/components/wise';
import {
  useWise,
  money,
  initialsOf,
  isRisky,
  type Recipient,
} from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { LiteAmountInput } from '@/features/lite/lite-amount-input';
import type { Person } from '@/lib/wise-spring-api';
import { LiteConfirmCard } from '@/features/lite/lite-confirm-card';

type SendParams = {
  stage?: string;
  recipient?: string;
  name?: string;
  amount?: string;
};
export default function Send() {
  return (
    <SendContent />
  );
}

function SendContent() {
  const params = useLocalSearchParams<SendParams>();
  const stage = params.stage ?? 'who';
  const known = useWise((state) =>
    state.transferRecipients.find((person) => person.id === params.recipient),
  );
  const recipient = known ?? {
    id: params.recipient ?? 'new-person',
    name: params.name ?? 'Someone new',
    initials: initialsOf(params.name ?? 'New person'),
    relationship: 'New person',
  };
  const go = (nextStage: string, extra: Partial<SendParams> = {}) =>
    router.push({ pathname: '/send', params: { ...params, stage: nextStage, ...extra } });
  if (stage === 'new')
    return (
      <NewRecipient
        onContinue={(r) => go('amount', { recipient: r.id, name: r.name })}
      />
    );
  if (stage === 'amount')
    return (
      <Amount
        recipient={recipient}
        initial={params.amount ?? '50'}
        onContinue={(amount) =>
          go(
            isRisky(useWise.getState(), recipient, amount) && useWise.getState().scamPause
              ? 'scam'
              : 'confirm',
            { amount: String(amount) },
          )
        }
      />
    );
  if (stage === 'scam')
    return (
      <ScamPause recipient={recipient} amount={Number(params.amount)} onNo={() => go('confirm')} />
    );
  if (stage === 'confirm') return <Confirm recipient={recipient} amount={Number(params.amount)} />;
  return (
    <ChooseRecipient
      onSelect={(r) => go('amount', { recipient: r.id, name: r.name })}
      onNew={() => go('new')}
    />
  );
}
function ChooseRecipient({
  onSelect,
  onNew,
}: {
  onSelect: (r: Recipient) => void;
  onNew: () => void;
}) {
  const favourites = useWise((s) => s.transferRecipients);
  return (
    <Screen>
      <Heading>Who do you want to send to?</Heading>
      <View>
        {favourites.length ? (
          favourites.map((r, i) => (
            <View key={r.id} style={i < favourites.length - 1 ? styles.divider : undefined}>
              <Row
                title={r.name}
                subtitle={r.relationship}
                initials={r.initials}
                badge
                onPress={() => onSelect(r)}
              />
            </View>
          ))
        ) : (
          <Empty icon={Users} action="Someone new" onPress={onNew}>
            People you’ve sent money to will appear here.
          </Empty>
        )}
      </View>
      <DashedCard title="Someone new" icon={UserRoundPlus} onPress={onNew} />
    </Screen>
  );
}
function NewRecipient({ onContinue }: { onContinue: (r: Recipient) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const lookup = useWise((state) => state.lookupRecipient);
  const checkNew = useWise((state) => state.checkNew);
  const wiseId = value.trim().replace(/^@/, '').toLowerCase();
  const validId = /^[a-z0-9_.-]{1,64}$/.test(wiseId);
  const [match, setMatch] = useState<{ query: string; account?: Person; error?: string }>();
  const current = match?.query === wiseId ? match : undefined;
  const account = current?.account;
  const message = error || current?.error;

  useEffect(() => {
    if (!validId) return undefined;
    let active = true;
    const timer = setTimeout(() => {
      void lookup(wiseId).then(
        (person) => {
          if (active) setMatch({ query: wiseId, account: person });
        },
        (failure: unknown) => {
          if (active) {
            setMatch({
              query: wiseId,
              error: failure instanceof Error ? failure.message : 'Could not find this account.',
            });
          }
        },
      );
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [lookup, validId, wiseId]);

  const next = () => {
    if (!account) {
      setError(current?.error ?? 'Enter a valid Wise ID.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    onContinue({
      id: account.id,
      name: account.name,
      initials: initialsOf(account.name),
      relationship: 'New person',
    });
  };
  return (
    <Screen footer={<Pill onPress={next} loading={validId && !current}>Continue</Pill>}>
      <Heading>Someone new</Heading>
      <View style={styles.section}>
        <Label>
          <Label.Text style={{ fontSize: 20, fontFamily: 'Inter_600SemiBold' }}>Wise ID</Label.Text>
        </Label>
        <Input
          value={value}
          onChangeText={(v) => {
            setValue(v);
            setError('');
          }}
          accessibilityLabel="Wise ID"
          placeholder="@anna"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.field}
        />
      </View>
      {account ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar initials={initialsOf(account.name)} size={52} badge />
          <View style={{ flex: 1 }}>
            <Copy size={18} bold>
              {account.name}
            </Copy>
            <Copy size={15} color={c.muted}>
              {`@${account.wiseId}`}
            </Copy>
          </View>
          <Check size={24} color={c.forest} strokeWidth={2} />
        </View>
      ) : null}
      {checkNew ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <ShieldCheck size={24} color={c.forest} strokeWidth={1.8} />
          <Copy size={17} style={{ flex: 1 }}>
            New people need approval.
          </Copy>
        </View>
      ) : null}
      {message ? <ErrorCopy>{message}</ErrorCopy> : null}
    </Screen>
  );
}
function Amount({
  recipient,
  initial,
  onContinue,
}: {
  recipient: Recipient;
  initial: string;
  onContinue: (amount: number) => void;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState('');
  const balance = useWise((s) => s.balance);
  const limit = useWise((s) => s.limit);
  const checkNew = useWise((s) => s.checkNew);
  const known = useWise((s) => s.favouriteIds).includes(recipient.id);
  const typed = Number(value.replace(',', '.'));
  const hint =
    checkNew && !known
      ? 'New people need approval.'
      : limit === null
        ? ''
        : typed > limit
          ? `Over ${money(limit)} needs approval.`
          : `Up to ${money(limit)} without approval.`;
  const next = () => {
    const amount = Math.round(Number(value.replace(',', '.')) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter an amount greater than zero.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (amount > balance) {
      setError('There is not enough money for this transfer.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    onContinue(amount);
  };
  return (
    <Screen
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={next}
          style={{
            minHeight: 64,
            borderRadius: 32,
            backgroundColor: c.green,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Copy size={20} bold color={c.forest}>
            Continue
          </Copy>
          <ArrowRight size={22} color={c.forest} />
        </Pressable>
      }
    >
      <Heading>How much to {recipient.name}?</Heading>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Change recipient, currently ${recipient.name}`}
        onPress={() => router.back()}
        style={{
          minHeight: 64,
          borderRadius: 32,
          backgroundColor: c.card,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: c.forest,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Copy size={20} bold color={c.white}>
            {recipient.name.charAt(0).toUpperCase()}
          </Copy>
        </View>
        <Copy size={18} bold style={{ flex: 1 }} numberOfLines={1}>
          {recipient.name}
        </Copy>
      </Pressable>
      <LiteAmountInput
        value={value}
        label="You send"
        showTransferDetails
        cardTone="gray"
        onChange={(v) => {
          setValue(v);
          setError('');
        }}
        error={error}
      />
      {hint ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <ShieldCheck size={24} color={c.forest} />
          <Copy size={17} style={{ flex: 1 }}>
            {hint}
          </Copy>
        </View>
      ) : null}
    </Screen>
  );
}
function ScamPause({
  recipient,
  amount,
  onNo,
}: {
  recipient: Recipient;
  amount: number;
  onNo: () => void;
}) {
  const submit = useWise((s) => s.submit);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const block = async () => {
    setBusy(true);
    try {
      const id = await submit(recipient, amount, true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      router.replace({ pathname: '/result', params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'This transfer could not be checked. Try again.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setBusy(false);
    }
  };
  return (
    <Screen
      footer={
        <View style={{ gap: 12 }}>
          <Pill tone="dark" onPress={onNo} disabled={busy}>
            {"No, it's my own decision"}
          </Pill>
          <Pill tone="white" onPress={() => void block()} loading={busy}>
            Yes, someone is calling me
          </Pill>
        </View>
      }
    >
      <Stack.Screen options={{ title: 'Safety check' }} />
      <View style={[styles.alert, { alignItems: 'center', paddingVertical: 32, gap: 28 }]}>
        <IconCircle icon={CircleAlert} size={64} background={c.yellowText} color={c.yellow} />
        <Statement color={c.yellowText} size={44}>
          QUICK{'\n'}SAFETY CHECK
        </Statement>
        <Copy size={22} color={c.yellowText} style={{ textAlign: 'center' }}>
          Is someone on the phone right now asking you to send money quickly?
        </Copy>
      </View>
      {error ? <ErrorCopy>{error}</ErrorCopy> : null}
    </Screen>
  );
}
function Confirm({ recipient, amount }: { recipient: Recipient; amount: number }) {
  const submit = useWise((s) => s.submit);
  const checkNew = useWise((s) => s.checkNew);
  const favouriteIds = useWise((s) => s.favouriteIds);
  const limit = useWise((s) => s.limit);
  const risky = isRisky({ checkNew, favouriteIds, limit }, recipient, amount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const send = async () => {
    setBusy(true);
    try {
      const id = await submit(recipient, amount, false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/result', params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your transfer did not go through. Try again.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setBusy(false);
    }
  };
  return (
    <Screen
      footer={<Pill onPress={() => void send()} loading={busy}>{`Send ${money(amount)}`}</Pill>}
      style={{ gap: 32 }}
    >
      <Stack.Screen options={{ title: 'Check and send' }} />
      <Heading>All looking right?</Heading>
      <LiteConfirmCard recipient={recipient} amount={amount} risky={risky} />
      {risky ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <ShieldCheck size={24} color={c.forest} />
          <Copy size={17} style={{ flex: 1 }}>
            Your money stays with you until then.
          </Copy>
        </View>
      ) : null}
      {error ? <ErrorCopy>{error}</ErrorCopy> : null}
    </Screen>
  );
}
