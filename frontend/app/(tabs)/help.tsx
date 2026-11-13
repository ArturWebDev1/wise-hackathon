import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Phone, ShieldCheck, SlidersHorizontal, Users, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  TopBar,
  Heading,
  Copy,
  Pill,
  DashedCard,
  GreyCard,
  callPerson,
} from '@/components/wise';
import { useWise, money } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';

export default function Help() {
  const role = useWise((s) => s.role);
  const limit = useWise((s) => s.limit);
  const reset = useWise((s) => s.reset);
  const helper = role === 'nikita';
  return (
    <Screen safe>
      <TopBar helper={helper} />
      <Heading>{helper ? 'Here for Mom.' : 'A little help,\nwhenever you need.'}</Heading>
      {helper ? (
        <Pill icon={Phone} onPress={() => callPerson(true)}>
          Call Mom
        </Pill>
      ) : null}
      <GreyCard>
        <ShieldCheck size={32} color={c.forest} strokeWidth={1.8} />
        <Copy bold>Your money, your decision.</Copy>
        <Copy size={18}>
          Favourites up to {money(limit ?? 300)} go straight through. Nikita checks new people and
          larger transfers.
        </Copy>
        <Copy size={18}>Nikita can’t see your password or spend your money.</Copy>
      </GreyCard>
      <DashedCard
        title="Protection rules"
        icon={SlidersHorizontal}
        onPress={() => router.push('/rules')}
      />
      <DashedCard title="Trusted Helper" icon={Users} onPress={() => router.push('/onboarding')} />
      {helper ? null : (
        <Pill small tone="pale" onPress={() => router.push('/switch-mode')}>
          Use regular Wise
        </Pill>
      )}
      <View>
        <Pill
          small
          tone="white"
          onPress={() =>
            Alert.alert(
              'Reset the demo?',
              'Restore Maria’s balance and clear demo transfers and decisions.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  onPress: () => {
                    reset()
                      .then(() => {
                        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        router.replace('/');
                      })
                      .catch((e: unknown) =>
                        Alert.alert(
                          'Could not reset',
                          e instanceof Error ? e.message : 'Try again.',
                        ),
                      );
                  },
                },
              ],
            )
          }
        >
          Reset demo
        </Pill>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <RotateCcw size={16} color={c.muted} />
          <Copy size={12} color={c.muted}>
            Mock money only · Wise hackathon prototype
          </Copy>
        </View>
      </View>
    </Screen>
  );
}
