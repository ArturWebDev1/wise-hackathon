import { View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, UserRoundPlus } from 'lucide-react-native';
import { Copy } from '@/components/wise';
import { initialsOf, useWise } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { RingAvatar, Tap, WiseCard, ink } from '@/features/fullwise/parts';
import { HelperOnly } from './helper-only';
import { H1, Sub } from './page';
import { usePeople } from './people-store';

const open = (id: string) => router.push({ pathname: '/family-person', params: { id } });

function PersonRow({
  name,
  text,
  initials,
  badge,
  onPress,
}: {
  name: string;
  text: string;
  initials: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Tap onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <RingAvatar initials={initials} />
        <View style={{ flex: 1, gap: 1 }}>
          <Copy bold size={17} color={ink}>
            {name}
          </Copy>
          <Copy size={15} color="#4A4A47">
            {text}
          </Copy>
        </View>
        {badge ? (
          <View
            style={{
              backgroundColor: c.yellow,
              borderRadius: 99,
              minWidth: 26,
              paddingHorizontal: 8,
              paddingVertical: 3,
              alignItems: 'center',
            }}
          >
            <Copy size={13} bold color={c.yellowText}>
              {String(badge)}
            </Copy>
          </View>
        ) : null}
        <ChevronRight size={18} color="#6A6C6A" strokeWidth={1.8} />
      </View>
    </Tap>
  );
}

export function FamilyHub() {
  const pending = useWise((s) => s.transfers.filter((t) => t.status === 'pending').length);
  const people = usePeople((s) => s.people);
  return (
    <HelperOnly>
      <H1>Family protection</H1>
      <Sub>People you protect.</Sub>
      <View style={{ gap: 20 }}>
        <PersonRow
          name="Maria Kask"
          text={
            pending
              ? `${pending} ${pending === 1 ? 'request' : 'requests'} waiting`
              : 'Mom · Protected'
          }
          initials="MK"
          badge={pending}
          onPress={() => open('maria')}
        />
        {people.map((p) => (
          <PersonRow
            key={p.id}
            name={p.name}
            text={`${p.relationship} · Invite sent`}
            initials={initialsOf(p.name)}
            onPress={() => open(p.id)}
          />
        ))}
      </View>
      <WiseCard
        title="Add someone to protect"
        text="Invite a family member and set their limits."
        icon={UserRoundPlus}
        chevron
        onPress={() => router.push('/family-add')}
      />
    </HelperOnly>
  );
}
