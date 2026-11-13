import { View } from 'react-native';
import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { Copy, Empty, Heading, TransferRow } from '@/components/wise';
import { useWise, type Transfer } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { BackLink, HelperOnly } from './helper-only';

export function RequestsList() {
  const transfers = useWise((s) => s.transfers);
  // Safe transfers go straight through, so only these ever needed Nikita.
  const requests = transfers.filter((t) => t.direction === 'outgoing' && t.status !== 'sent');
  const waiting = requests.filter((t) => t.status === 'pending');
  const answered = requests.filter((t) => t.status !== 'pending');
  return (
    <HelperOnly>
      <BackLink to="/full/family" />
      <Heading>Requests</Heading>
      {requests.length ? null : (
        <Empty icon={ShieldCheck} action="Back" onPress={() => router.navigate('/full/family')}>
          No requests yet. Risky transfers from Mom will appear here.
        </Empty>
      )}
      <Section title={`Waiting for you (${waiting.length})`} transfers={waiting} />
      <Section title="Answered" transfers={answered} />
    </HelperOnly>
  );
}

function Section({ title, transfers }: { title: string; transfers: Transfer[] }) {
  if (!transfers.length) return null;
  return (
    <View>
      <Copy size={20} bold>
        {title}
      </Copy>
      {transfers.map((t) => (
        <View key={t.id} style={{ borderBottomWidth: 1, borderBottomColor: c.card }}>
          <TransferRow transfer={t} helper />
        </View>
      ))}
    </View>
  );
}
