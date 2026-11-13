import { View } from 'react-native';
import { ShieldCheck, Zap } from 'lucide-react-native';
import { Avatar, Copy } from '@/components/wise';
import { money, type Recipient } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';

type LiteConfirmCardProps = {
  recipient: Recipient;
  amount: number;
  risky: boolean;
};

export function LiteConfirmCard({ recipient, amount, risky }: LiteConfirmCardProps) {
  const StatusIcon = risky ? ShieldCheck : Zap;
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: c.card,
        borderColor: c.pale,
        borderRadius: 24,
        borderWidth: 1,
        gap: 22,
        paddingHorizontal: 24,
        paddingVertical: 32,
      }}
    >
      <Avatar initials={recipient.initials} size={76} badge background={c.pale} />
      <Copy bold size={24} style={{ textAlign: 'center' }}>
        To {recipient.name}
      </Copy>
      <Copy bold size={52} style={{ letterSpacing: -2, textAlign: 'center' }}>
        {money(amount)}
      </Copy>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <StatusIcon size={22} color={c.forest} />
        <Copy size={18} color={c.muted} style={{ textAlign: 'center', flexShrink: 1 }}>
          {risky ? 'Nikita will check this first' : 'Arrives in seconds'}
        </Copy>
      </View>
      {recipient.iban ? (
        <Copy size={14} color={c.muted} style={{ textAlign: 'center' }}>
          {recipient.iban.replace(/(.{4})/g, '$1 ').trim()}
        </Copy>
      ) : null}
    </View>
  );
}
