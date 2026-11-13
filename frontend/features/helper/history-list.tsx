import { View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { Empty, Heading, TransferRow } from '@/components/wise';
import { useWise } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { HelperOnly, goBack } from './helper-only';

export function HistoryList() {
  const transfers = useWise((s) => s.transfers);
  return (
    <HelperOnly>
      <Heading>Maria’s history</Heading>
      {transfers.length ? (
        <View>
          {transfers.map((t) => (
            <View key={t.id} style={{ borderBottomWidth: 1, borderBottomColor: c.card }}>
              <TransferRow transfer={t} helper />
            </View>
          ))}
        </View>
      ) : (
        <Empty icon={ShieldCheck} action="Back" onPress={goBack}>
          Maria’s transfers will appear here.
        </Empty>
      )}
    </HelperOnly>
  );
}
