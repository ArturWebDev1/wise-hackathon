import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ShieldCheck, LockKeyhole, Check, Send, Users, Fingerprint } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Statement,
  Copy,
  Pill,
  Avatar,
  IconCircle,
  WiseMark,
  ErrorCopy,
} from '@/components/wise';
import { useWise } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';

export default function Onboarding() {
  const role = useWise((s) => s.role);
  const invited = useWise((s) => s.inviteSent);
  const consent = useWise((s) => s.consent);
  const invite = useWise((s) => s.invite);
  const agree = useWise((s) => s.agree);
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const helper = role === 'nikita';
  if (!helper && !consent && !verified) return <Identify onConfirm={() => setVerified(true)} />;
  return (
    <Screen
      color={c.green}
      style={{ justifyContent: 'center', alignItems: 'center', gap: 28 }}
      footer={
        <View style={{ gap: 8 }}>
          <Pill
            tone="dark"
            icon={consent ? Check : helper ? Send : ShieldCheck}
            loading={busy}
            onPress={() => {
              if (consent) {
                router.dismissTo('/');
                return;
              }
              setBusy(true);
              setError('');
              (helper ? invite() : agree())
                .then(() => {
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  if (helper) setSent(true);
                  else router.dismissTo('/');
                })
                .catch((e: unknown) =>
                  setError(e instanceof Error ? e.message : 'Could not save this. Try again.'),
                )
                .finally(() => setBusy(false));
            }}
          >
            {consent
              ? 'Back home'
              : helper
                ? sent || invited
                  ? 'Invite sent'
                  : 'Send invite to Mom'
                : 'Yes, I agree'}
          </Pill>
          {error ? <ErrorCopy>{error}</ErrorCopy> : null}
          {helper && (sent || invited) && !consent ? (
            <Pill
              tone="white"
              onPress={() => {
                useWise.getState().setRole('maria');
                router.replace('/onboarding');
              }}
            >
              Open Maria’s invite
            </Pill>
          ) : null}
        </View>
      }
    >
      <WiseMark size={42} />
      <Statement size={48}>
        {consent ? 'BETTER.\nTOGETHER.' : 'MONEY MADE\nSIMPLE.\nAND SAFE.'}
      </Statement>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Avatar initials="MA" size={64} />
        <IconCircle icon={Users} size={44} background={c.forest} color={c.green} />
        <Avatar initials="NG" size={64} />
      </View>
      <Copy size={22} bold color={c.forest} style={{ textAlign: 'center' }}>
        {consent
          ? 'Nikita is your Trusted Helper.'
          : helper
            ? 'Give Mom confidence with her money.'
            : 'Nikita will protect you.'}
      </Copy>
      <Copy size={20} color={c.forest} style={{ textAlign: 'center' }}>
        {helper
          ? 'You can only approve or decline risky transfers. Everyday payments stay simple.'
          : 'He can only approve or decline risky transfers.'}
      </Copy>
      {helper || consent ? null : <ShowToNikita />}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <LockKeyhole size={26} color={c.forest} strokeWidth={1.8} />
        <Copy size={18} bold color={c.forest} style={{ flex: 1 }}>
          {helper
            ? 'You can NOT see her password or spend her money.'
            : 'He can NOT see your password or spend your money.'}
        </Copy>
      </View>
    </Screen>
  );
}

const SMART_ID_DELAY_MS = 900;

function Identify({ onConfirm }: { onConfirm: () => void }) {
  const [busy, setBusy] = useState(false);
  const confirm = () => {
    setBusy(true);
    setTimeout(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onConfirm();
    }, SMART_ID_DELAY_MS);
  };
  return (
    <Screen
      color={c.green}
      style={{ justifyContent: 'center', alignItems: 'center', gap: 28 }}
      footer={
        <View style={{ gap: 8 }}>
          <Pill tone="dark" icon={Fingerprint} loading={busy} onPress={confirm}>
            Confirm with Smart-ID
          </Pill>
          <Copy size={13} color={c.forest} style={{ textAlign: 'center' }}>
            Demo only. Smart-ID is simulated.
          </Copy>
        </View>
      }
    >
      <WiseMark size={42} />
      <Statement size={44}>{'NIKITA\nINVITED YOU'}</Statement>
      <Avatar initials="NG" size={72} />
      <Copy size={26} bold color={c.forest} style={{ textAlign: 'center' }}>
        Are you Maria?
      </Copy>
      <Copy size={20} color={c.forest} style={{ textAlign: 'center' }}>
        Confirm it’s you. It takes a few seconds.
      </Copy>
    </Screen>
  );
}

const QR_CELLS = 21;
const QR_CELL_SIZE = 6;
const FINDER_SIZE = 7;
const QR_RANGE = Array.from({ length: QR_CELLS }, (_, index) => index);

/** A decorative code: three corner squares plus a fixed pattern. Not a scannable QR. */
function isDark(x: number, y: number) {
  const corner = (cx: number, cy: number) => {
    const dx = x - cx;
    const dy = y - cy;
    if (dx < 0 || dy < 0 || dx >= FINDER_SIZE || dy >= FINDER_SIZE) return undefined;
    return (
      dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
    );
  };
  const finder =
    corner(0, 0) ?? corner(QR_CELLS - FINDER_SIZE, 0) ?? corner(0, QR_CELLS - FINDER_SIZE);
  return finder ?? (x * 31 + y * 17 + x * y) % 3 === 0;
}

function ShowToNikita() {
  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View style={{ backgroundColor: c.white, padding: 12, borderRadius: 16 }}>
        {QR_RANGE.map((y) => (
          <View key={y} style={{ flexDirection: 'row' }}>
            {QR_RANGE.map((x) => (
              <View
                key={x}
                style={{
                  width: QR_CELL_SIZE,
                  height: QR_CELL_SIZE,
                  backgroundColor: isDark(x, y) ? c.forest : c.white,
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <Copy size={15} color={c.forest} style={{ textAlign: 'center' }}>
        Show this to Nikita so he can scan it.
      </Copy>
    </View>
  );
}
