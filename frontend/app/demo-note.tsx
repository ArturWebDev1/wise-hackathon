import { View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Info } from 'lucide-react-native';
import { Screen, Heading, Copy, Pill, IconCircle } from '@/components/wise';
import { useWise } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { goBack } from '@/features/helper/helper-only';

export default function DemoNote() {
  const { title } = useLocalSearchParams<{ title?: string }>();
  const helper = useWise((s) => s.role) === 'nikita';
  return (
    <Screen
      safe
      footer={
        <View style={{ gap: 12 }}>
          {helper ? (
            <Pill onPress={() => router.replace('/family-protection')}>Open Family protection</Pill>
          ) : null}
          <Pill tone={helper ? 'white' : 'dark'} onPress={goBack}>
            Back
          </Pill>
        </View>
      }
      style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 48, gap: 16 }}
    >
      <Stack.Screen options={{ title: 'Wise', headerRight: () => null }} />
      <IconCircle icon={Info} size={88} background={c.pale} color={c.forest} />
      <Heading center>{title ?? 'Wise'}</Heading>
      <Copy size={17} color={c.muted} style={{ textAlign: 'center' }}>
        This part of Wise isn’t in our demo.
      </Copy>
    </Screen>
  );
}
