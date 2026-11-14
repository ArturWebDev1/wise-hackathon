import { router } from 'expo-router';
import {
  CalendarClock,
  ArrowDownLeft,
  ArrowLeftRight,
  Landmark,
  ShieldCheck,
} from 'lucide-react-native';
import { Screen, Heading, DashedCard, Copy } from '@/components/wise';
import { useWise } from '@/lib/wise-store';
import { openDemo } from '@/features/helper/demo';
export default function Payments() {
  const helper = useWise((s) => s.role) === 'nikita';
  return (
    <Screen>
      <Heading>Payments</Heading>
      {helper ? (
        <DashedCard
          title="Family protection"
          icon={ShieldCheck}
          compact
          onPress={() => router.push('/family-protection')}
        />
      ) : null}
      <DashedCard
        title="Request money"
        icon={ArrowDownLeft}
        compact
        onPress={() => openDemo('Request money')}
      />
      <DashedCard
        title="Scheduled transfers"
        icon={CalendarClock}
        compact
        onPress={() => openDemo('Scheduled transfers')}
      />
      <DashedCard
        title="Direct debits"
        icon={Landmark}
        compact
        onPress={() => openDemo('Direct debits')}
      />
      <DashedCard
        title="Send money"
        icon={ArrowLeftRight}
        compact
        onPress={() => router.push(helper ? '/send-maria' : '/send')}
      />
      <Copy size={14}>Full Wise demo · No real payments</Copy>
    </Screen>
  );
}
