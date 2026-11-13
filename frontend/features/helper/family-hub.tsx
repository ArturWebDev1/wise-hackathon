import { View } from 'react-native';
import { router } from 'expo-router';
import { UserRoundPlus } from 'lucide-react-native';
import { Copy, DashedCard, Heading, Row, styles } from '@/components/wise';
import { initialsOf, useWise } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { HelperOnly } from './helper-only';
import { usePeople } from './people-store';

const open = (id: string) => router.push({ pathname: '/family-person', params: { id } });

export function FamilyHub() {
  const pending = useWise((s) => s.transfers.filter((t) => t.status === 'pending').length);
  const people = usePeople((s) => s.people);
  return (
    <HelperOnly>
      <Heading>Family protection</Heading>
      <Copy size={17} color={c.muted}>
        People you protect.
      </Copy>
      <View>
        <View style={people.length ? styles.divider : undefined}>
          <Row
            title="Maria"
            subtitle={
              pending
                ? `${pending} ${pending === 1 ? 'request' : 'requests'} waiting`
                : 'Mom · Protected'
            }
            initials="MA"
            badge
            onPress={() => open('maria')}
            trailing={
              pending ? (
                <View
                  style={{
                    backgroundColor: c.yellow,
                    borderRadius: 99,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Copy size={13} bold color={c.yellowText}>
                    {pending}
                  </Copy>
                </View>
              ) : null
            }
          />
        </View>
        {people.map((p, index) => (
          <View key={p.id} style={index < people.length - 1 ? styles.divider : undefined}>
            <Row
              title={p.name}
              subtitle={`${p.relationship} · Invite sent`}
              initials={initialsOf(p.name)}
              onPress={() => open(p.id)}
            />
          </View>
        ))}
      </View>
      <DashedCard
        title="Add someone to protect"
        icon={UserRoundPlus}
        compact
        onPress={() => router.push('/family-add')}
      />
    </HelperOnly>
  );
}
