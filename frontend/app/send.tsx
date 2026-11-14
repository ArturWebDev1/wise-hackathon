import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Input, Label } from 'heroui-native';
import {
  ArrowRight,
  ChevronRight,
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
  GreyCard,
  Statement,
  IconCircle,
  ErrorCopy,
  Empty,
  styles,
} from '@/components/wise';
import {
  useWise,
  recipients,
  money,
  validIban,
  initialsOf,
  isRisky,
  type Recipient,
} from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { LiteAmountInput } from '@/features/lite/lite-amount-input';
import { LiteConfirmCard } from '@/features/lite/lite-confirm-card';

type SendParams = {
  stage?: string;
  recipient?: string;
  name?: string;
  iban?: string;
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
  const recipient = recipients.find((r) => r.id === params.recipient) ?? {
    id: params.recipient ?? 'new-person',
    name: params.name ?? 'Someone new',
    initials: initialsOf(params.name ?? 'New person'),
    relationship: 'New person',
    iban: params.iban,
  };
  const go = (nextStage: string, extra: Partial<SendParams> = {}) =>
    router.push({ pathname: '/send', params: { ...params, stage: nextStage, ...extra } });
  if (stage === 'new')
    return (
      <NewRecipient
        onContinue={(r) => go('amount', { recipient: r.id, name: r.name, iban: r.iban })}
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
    <ChooseRecipient onSelect={(r) => go('amount', { recipient: r.id })} onNew={() => go('new')} />
  );
}
function ChooseRecipient({
  onSelect,
  onNew,
}: {
  onSelect: (r: Recipient) => void;
  onNew: () => void;
}) {
  const favouriteIds = useWise((s) => s.favouriteIds);
  const favourites = recipients.filter((r) => favouriteIds.includes(r.id));
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
          <Empty icon={Users} action="Choose favourites" onPress={() => router.push('/rules')}>
            Add people you send to often.
          </Empty>
        )}
      </View>
      <DashedCard title="Someone new" icon={UserRoundPlus} onPress={onNew} />
    </Screen>
  );
}
function NewRecipient({ onContinue }: { onContinue: (r: Recipient) => void }) {
  const [name, setName] = useState('');
  const [iban, setIban] = useState('');
  const [error, setError] = useState('');
  const next = () => {
    const clean = iban.replace(/\s/g, '').toUpperCase();
    if (!name.trim()) {
      setError('Enter the person’s name.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!validIban(clean)) {
      setError('Check the IBAN and try again.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    onContinue({
      id: `new-${clean}`,
      name: name.trim(),
      initials: initialsOf(name),
      relationship: 'New person',
      iban: clean,
    });
  };
  return (
    <Screen footer={<Pill onPress={next}>Continue</Pill>}>
      <Heading>Someone new</Heading>
      <View style={styles.section}>
        <Label>
          <Label.Text style={{ fontSize: 20, fontFamily: 'Inter_600SemiBold' }}>
            Full name
          </Label.Text>
        </Label>
        <Input
          value={name}
          onChangeText={(v) => {
            setName(v);
            setError('');
          }}
          placeholder="Name of the person"
          autoCapitalize="words"
          style={styles.field}
        />
      </View>
      <View style={styles.section}>
        <Label>
          <Label.Text style={{ fontSize: 20, fontFamily: 'Inter_600SemiBold' }}>IBAN</Label.Text>
        </Label>
        <Input
          value={iban}
          onChangeText={(v) => {
            setIban(v);
            setError('');
          }}
          placeholder="DE89 3704 0044 0532 0130 00"
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.field}
        />
      </View>
      <GreyCard>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <ShieldCheck size={24} color={c.forest} strokeWidth={1.8} />
          <Copy size={18} color={c.muted}>
            Nikita will check this
          </Copy>
        </View>
      </GreyCard>
      {error ? <ErrorCopy>{error}</ErrorCopy> : null}
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
        <ChevronRight size={22} color={c.forest} />
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
      <Copy size={16} color={c.muted}>
        Available: {money(balance, true)}
      </Copy>
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
            Your money stays with you until Nikita approves.
          </Copy>
        </View>
      ) : null}
      {error ? <ErrorCopy>{error}</ErrorCopy> : null}
    </Screen>
  );
}
