import { View } from 'react-native';
import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { Screen, Heading, Copy, Pill, IconCircle } from '@/components/wise';
import { wise as c } from '@/lib/wise-theme';

export default function SwitchMode() {
  return (
    <Screen
      style={{ justifyContent: 'center', alignItems: 'center', gap: 24 }}
      footer={
        <View style={{ gap: 12 }}>
          <Pill onPress={() => router.back()}>Stay in Wise Lite</Pill>
          <Pill small tone="white" onPress={() => router.replace('/full')}>
            Switch to full Wise
          </Pill>
        </View>
      }
    >
      <IconCircle icon={ShieldCheck} size={88} background={c.pale} color={c.forest} />
      <Heading center>Stay in Wise Lite?</Heading>
      <Copy size={20} color={c.muted} style={{ textAlign: 'center' }}>
        Wise Lite keeps things simple. Nikita still checks risky transfers in both modes.
      </Copy>
    </Screen>
  );
}
