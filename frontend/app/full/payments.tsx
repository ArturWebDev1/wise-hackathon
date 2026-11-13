import { router } from 'expo-router';
import { CalendarClock, ArrowDownLeft, ArrowLeftRight, Landmark } from 'lucide-react-native';
import { Screen, Heading, DashedCard, Copy } from '@/components/wise';
export default function Payments() {
  return (
    <Screen>
      <Heading>Payments</Heading>
      <DashedCard
        title="Request money"
        icon={ArrowDownLeft}
        compact
        onPress={() => router.push('/request')}
      />
      <DashedCard
        title="Scheduled transfers"
        icon={CalendarClock}
        compact
        onPress={() => router.push('/send')}
      />
      <DashedCard
        title="Direct debits"
        icon={Landmark}
        compact
        onPress={() => router.push('/rules')}
      />
      <DashedCard
        title="Send money"
        icon={ArrowLeftRight}
        compact
        onPress={() => router.push('/send')}
      />
      <Copy size={14}>Full Wise demo · No real payments</Copy>
    </Screen>
  );
}
