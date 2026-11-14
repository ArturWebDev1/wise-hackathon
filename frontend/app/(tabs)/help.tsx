import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Phone, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Screen, TopBar, Heading, Copy, Pill, callPerson } from '@/components/wise';
import { useWise, money } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';

export default function Help() {
  const limit = useWise((s) => s.limit);
  const reset = useWise((s) => s.reset);
  return (
    <Screen safe>
      <TopBar />
      <Heading>{'A little help,\nwhenever you need.'}</Heading>
      <Pill icon={Phone} onPress={() => callPerson(true)}>
        Call Nikita
      </Pill>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <ShieldCheck size={28} color={c.forest} strokeWidth={1.8} />
        <Copy size={18} style={{ flex: 1 }}>
          Nikita checks new people and transfers over {money(limit ?? 300)}.
        </Copy>
      </View>
      <Pill small tone="pale" onPress={() => router.push('/switch-mode')}>
        Use regular Wise
      </Pill>
      {/* Hidden rehearsal reset: long-press the footer. */}
      <Pressable
        onLongPress={() => {
          void reset().then(() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/');
          });
        }}
      >
        <Copy size={12} color={c.muted} style={{ textAlign: 'center' }}>
          Mock money only · Wise hackathon prototype
        </Copy>
      </Pressable>
    </Screen>
  );
}
