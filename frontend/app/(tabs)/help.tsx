import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Phone, ShieldCheck, Zap } from 'lucide-react-native';
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
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Zap size={26} color={c.forest} strokeWidth={1.8} />
          <Copy size={18} style={{ flex: 1 }}>
            {limit === null
              ? 'Transfers to your favourites are sent at once.'
              : `Up to ${money(limit)} to your favourites is sent at once.`}
          </Copy>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <ShieldCheck size={26} color={c.forest} strokeWidth={1.8} />
          <Copy size={18} style={{ flex: 1 }}>
            {limit === null
              ? 'New people need approval.'
              : 'New people and bigger amounts need approval.'}
          </Copy>
        </View>
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
