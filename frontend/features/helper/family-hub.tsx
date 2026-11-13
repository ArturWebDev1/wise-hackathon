import { router } from 'expo-router';
import { Clock3, History, SlidersHorizontal } from 'lucide-react-native';
import { Copy, DashedCard, Heading } from '@/components/wise';
import { useWise } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { BackLink, HelperOnly } from './helper-only';

export function FamilyHub() {
  const pending = useWise((s) => s.transfers.filter((t) => t.status === 'pending').length);
  return (
    <HelperOnly>
      <BackLink to="/full/payments" />
      <Heading>Family protection</Heading>
      <Copy size={17} color={c.muted}>
        You protect Maria (Mom).
      </Copy>
      <DashedCard
        title={pending ? `Requests (${pending})` : 'Requests'}
        icon={Clock3}
        compact
        onPress={() => router.push('/full/requests')}
      />
      <DashedCard
        title="Protection rules"
        icon={SlidersHorizontal}
        compact
        onPress={() => router.push('/rules')}
      />
      <DashedCard
        title="Maria’s history"
        icon={History}
        compact
        onPress={() => router.push('/full/history')}
      />
    </HelperOnly>
  );
}
