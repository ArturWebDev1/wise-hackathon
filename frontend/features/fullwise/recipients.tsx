import { View } from 'react-native';
import { ChevronRight, Gift, Plus, ScanLine } from 'lucide-react-native';
import { Copy } from '@/components/wise';
import { recipients } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { Chip, FullPage, RingAvatar, Tap, ink, useIsHelper } from './parts';

function TopPill({
  children,
  icon: Icon,
  green = false,
  onPress,
}: {
  children: string;
  icon: typeof Plus;
  green?: boolean;
  onPress?: () => void;
}) {
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: green ? c.green : c.pale,
        borderRadius: 69,
        paddingHorizontal: 14,
        paddingVertical: 9,
      }}
    >
      <Icon size={17} color={c.forest} strokeWidth={1.8} />
      <Copy bold size={15} color={c.forest}>
        {children}
      </Copy>
    </Tap>
  );
}

type Person = { key: string; name: string; tag: string; initials: string };

export function FullRecipients() {
  const helper = useIsHelper();
  const people: Person[] = helper
    ? [
        {
          key: 'maria',
          name: 'Maria Kask',
          tag: '@maria1147',
          initials: 'MK',
        },
      ]
    : recipients.map((r) => ({
        key: r.id,
        name: r.name,
        tag: `@${r.id}1147`,
        initials: r.initials,
      }));
  return (
    <FullPage
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip icon={Gift} label="Invite" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TopPill green icon={Plus}>
              Add
            </TopPill>
            <TopPill icon={ScanLine}>
              Upload
            </TopPill>
          </View>
        </View>
      }
    >
      <Copy bold size={28} color={ink} style={{ lineHeight: 32, letterSpacing: -1.2 }}>
        Recipients
      </Copy>
      <Copy size={15} color="#4A4A47">
        All accounts
      </Copy>
      <View style={{ gap: 17 }}>
        {people.map((p) => (
          <Tap key={p.key}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <RingAvatar initials={p.initials} />
              <View style={{ flex: 1, gap: 2 }}>
                <Copy bold size={17} color={ink}>
                  {p.name}
                </Copy>
                <Copy size={15} color="#4A4A47">
                  {p.tag}
                </Copy>
              </View>
              <ChevronRight size={18} color="#6A6C6A" strokeWidth={1.8} />
            </View>
          </Tap>
        ))}
      </View>
    </FullPage>
  );
}
