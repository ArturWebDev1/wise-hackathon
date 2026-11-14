import { View } from 'react-native';
import { router } from 'expo-router';
import { Hourglass, Phone, Send, ShieldCheck } from 'lucide-react-native';
import { Screen, Heading, Copy, IconCircle, Pill, callPerson } from '@/components/wise';
import { money, type Transfer } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';

export function LitePendingResult({ transfer }: { transfer: Transfer }) {
  return (
    <Screen
      safe
      footer={
        <View style={{ gap: 12 }}>
          <Pill icon={Phone} tone="pale" onPress={() => callPerson()}>
            Call Nikita
          </Pill>
          <Pill tone="dark" onPress={() => router.dismissTo('/')}>
            Back home
          </Pill>
        </View>
      }
      style={{ justifyContent: 'center', alignItems: 'center', gap: 30, paddingVertical: 32 }}
    >
      <IconCircle icon={Hourglass} size={88} background={c.pale} color={c.forest} />
      <Heading center>Waiting for approval</Heading>
      <View
        style={{
          backgroundColor: c.pale,
          borderRadius: 24,
          paddingHorizontal: 24,
          paddingVertical: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          alignSelf: 'stretch',
        }}
      >
        <Send size={24} color={c.forest} />
        <Copy size={22} style={{ textAlign: 'center', flexShrink: 1 }}>
          {money(transfer.amount)} to {transfer.recipient.name}
        </Copy>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <ShieldCheck size={24} color={c.forest} />
        <Copy size={17} color={c.muted} style={{ flexShrink: 1 }}>
          Your money is safe while you wait.
        </Copy>
      </View>
      <View style={{ height: 1, backgroundColor: c.pale, alignSelf: 'stretch' }} />
      <Copy size={16} color={c.muted} style={{ textAlign: 'center' }}>
        No answer in 12 hours? It cancels itself.
      </Copy>
    </Screen>
  );
}
