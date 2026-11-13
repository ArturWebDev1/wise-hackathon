import { View } from 'react-native';
import { router } from 'expo-router';
import { Clock3, History, ShieldCheck, SlidersHorizontal } from 'lucide-react-native';
import { Avatar, Copy, DashedCard, Empty, GreyCard, Heading, Pill } from '@/components/wise';
import { initialsOf, money, useWise } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { Detail } from './detail';
import { HelperOnly, goBack } from './helper-only';
import { usePeople } from './people-store';

export function PersonScreen({ id }: { id?: string }) {
  return <HelperOnly>{!id || id === 'maria' ? <Maria /> : <AddedPerson id={id} />}</HelperOnly>;
}

function Maria() {
  const pending = useWise((s) => s.transfers.filter((t) => t.status === 'pending').length);
  return (
    <>
      <Heading>Maria (Mom)</Heading>
      <Copy size={17} color={c.muted}>
        Protected by you.
      </Copy>
      <DashedCard
        title={pending ? `Requests (${pending})` : 'Requests'}
        icon={Clock3}
        compact
        onPress={() => router.push('/family-requests')}
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
        onPress={() => router.push('/family-history')}
      />
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
        <Avatar initials={initialsOf(person.name)} size={64} />
        <View style={{ flex: 1, gap: 2 }}>
          <Heading compact>{person.name}</Heading>
          <Copy size={17} color={c.muted}>
            {person.relationship}
          </Copy>
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
