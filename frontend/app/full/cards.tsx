import { View } from 'react-native';
import { CreditCard, Plus, LockKeyhole } from 'lucide-react-native';
import { Screen, Heading, Copy, Pill, DashedCard, WiseMark } from '@/components/wise';
import { wise as c } from '@/lib/wise-theme';
import { useWise } from '@/lib/wise-store';
import { openDemo } from '@/features/helper/demo';
export default function Cards() {
  const helper = useWise((s) => s.role) === 'nikita';
  return (
    <Screen>
      <Heading>Cards</Heading>
      <View
        style={{
          backgroundColor: c.green,
          borderRadius: 20,
          padding: 24,
          height: 210,
          justifyContent: 'space-between',
        }}
      >
        <WiseMark size={40} />
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}
        >
          <View>
            <Copy size={14} color={c.forest}>
              {helper ? 'Nikita' : 'Maria'}
            </Copy>
            <Copy size={20} bold color={c.forest}>
              {helper ? '•••• 2210' : '•••• 1147'}
            </Copy>
          </View>
          <CreditCard size={36} color={c.forest} />
        </View>
      </View>
      <Pill small icon={LockKeyhole} tone="pale" onPress={() => openDemo('Manage card')}>
        Manage card
      </Pill>
      <DashedCard
        title="Get a digital card"
        icon={Plus}
        compact
        onPress={() => openDemo('Digital card')}
      />
      <Copy size={14} color={c.muted}>
        Demo card · Not available for payments
      </Copy>
    </Screen>
  );
}
