import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Gift, Plus, ScanLine } from 'lucide-react-native';
import { Copy } from '@/components/wise';
import { recipients } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { openDemo } from '@/features/helper/demo';
import { Chip, FullPage, RingAvatar, ink, useIsHelper } from './parts';

function TopPill({
  children,
  icon: Icon,
  green = false,
  onPress,
}: {
  children: string;
  icon: typeof Plus;
  green?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
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
    </Pressable>
  );
}

type Person = { key: string; name: string; tag: string; initials: string; open: () => void };

export function FullRecipients() {
  const helper = useIsHelper();
  const people: Person[] = helper
    ? [
        {
          key: 'maria',
          name: 'Maria Kask',
          tag: '@maria1147',
          initials: 'MK',
          open: () => router.push('/send-maria'),
        },
      ]
    : recipients.map((r) => ({
        key: r.id,
        name: r.name,
        tag: `@${r.id}1147`,
        initials: r.initials,
        open: () =>
          router.push({ pathname: '/send', params: { stage: 'amount', recipient: r.id } }),
      }));
  return (
    <FullPage
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip icon={Gift} label="Invite" onPress={() => openDemo('Invite friends')} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TopPill green icon={Plus} onPress={() => openDemo('Add a recipient')}>
              Add
            </TopPill>
            <TopPill icon={ScanLine} onPress={() => openDemo('Upload')}>
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
          <Pressable key={p.key} onPress={p.open} accessibilityRole="button">
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
          </Pressable>
        ))}
      </View>
    </FullPage>
  );
}
