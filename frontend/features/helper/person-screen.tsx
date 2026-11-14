import { View } from 'react-native';
import { router } from 'expo-router';
import { Clock3, History, ShieldCheck, SlidersHorizontal } from 'lucide-react-native';
import { Copy, Empty, GreyCard, Pill } from '@/components/wise';
import { initialsOf, money, useWise } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { RingAvatar, WiseCard } from '@/features/fullwise/parts';
import { Detail } from './detail';
import { H1, Sub } from './page';
import { HelperOnly, goBack } from './helper-only';
import { usePeople } from './people-store';

export function PersonScreen({ id }: { id?: string }) {
  return <HelperOnly>{!id || id === 'maria' ? <Maria /> : <AddedPerson id={id} />}</HelperOnly>;
}

function Maria() {
  const pending = useWise((s) => s.transfers.filter((t) => t.status === 'pending').length);
  return (
    <>
      <H1>Maria Kask</H1>
      <Sub>Mom · Protected by you.</Sub>
      <View style={{ gap: 16 }}>
        <WiseCard
          title={pending ? `Requests (${pending})` : 'Requests'}
          text="Approve or decline her risky transfers."
          icon={Clock3}
          chevron
          onPress={() => router.push('/family-requests')}
        />
        <WiseCard
          title="Protection rules"
          text="Limits and checks for new recipients."
          icon={SlidersHorizontal}
          chevron
          onPress={() => router.push('/rules')}
        />
        <WiseCard
          title="Maria’s history"
          text="See everything she sent and received."
          icon={History}
          chevron
          onPress={() => router.push('/family-history')}
        />
      </View>
    </>
  );
}

function AddedPerson({ id }: { id: string }) {
  const person = usePeople((s) => s.people.find((p) => p.id === id));
  const remove = usePeople((s) => s.remove);
  if (!person)
    return (
      <Empty icon={ShieldCheck} action="Back" onPress={goBack}>
        This person isn’t available.
      </Empty>
    );
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <RingAvatar initials={initialsOf(person.name)} badge={false} />
        <View style={{ flex: 1, gap: 2 }}>
          <H1>{person.name}</H1>
          <Sub>{person.relationship}</Sub>
        </View>
      </View>
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: c.yellow,
          borderRadius: 99,
          paddingHorizontal: 14,
          paddingVertical: 8,
        }}
      >
        <Copy size={14} bold color={c.yellowText}>
          Invite sent
        </Copy>
      </View>
      <GreyCard style={{ padding: 20, gap: 12 }}>
        <Detail label="Ask me above" value={money(person.limit)} bold />
        <Detail label="New people" value={person.checkNew ? 'Ask me' : 'Don’t ask'} />
      </GreyCard>
      <Copy size={16} color={c.muted}>
        {`Waiting for ${person.name} to accept. Their requests and history will appear here once they do.`}
      </Copy>
      <Pill
        tone="danger"
        onPress={() => {
          remove(person.id);
          goBack();
        }}
      >
        {`Remove ${person.name}`}
      </Pill>
    </>
  );
}
