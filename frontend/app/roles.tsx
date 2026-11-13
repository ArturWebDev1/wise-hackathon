import { View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { ShieldCheck, ArrowRight } from 'lucide-react-native';
import { Screen, Copy, Statement, Pill, WiseMark, Avatar } from '@/components/wise';
import { wise as c } from '@/lib/wise-theme';
import { useWise, type Role } from '@/lib/wise-store';
import * as Haptics from 'expo-haptics';

export function RolePicker() {
  const pathname = usePathname();
  const setRole = useWise((s) => s.setRole);
  const select = (role: Role) => {
    setRole(role);
    void Haptics.selectionAsync();
    router.dismissTo('/');
  };
  return (
    <Screen safe={pathname === '/'} style={{ padding: 0, gap: 0 }}>
      <View
        style={{
          backgroundColor: c.green,
          padding: 28,
          paddingTop: 28,
          paddingBottom: 38,
          gap: 32,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <WiseMark size={32} />
          <Copy size={30} bold color={c.forest} style={{ letterSpacing: -1.6 }}>
            wise
          </Copy>
          <View
            style={{
              borderWidth: 1,
              borderColor: c.forest,
              borderRadius: 99,
              paddingHorizontal: 10,
              paddingVertical: 3,
              marginLeft: 4,
            }}
          >
            <Copy size={14} bold color={c.forest}>
              Lite
            </Copy>
          </View>
        </View>
        <Statement size={52}>
          MONEY MADE{'\n'}SIMPLE.{'\n'}AND SAFE.
        </Statement>
        <View
          style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}
        >
          <ShieldCheck size={19} color={c.forest} strokeWidth={1.8} />
          <Copy size={16} color={c.forest}>
            A little help. A lot of confidence.
          </Copy>
        </View>
      </View>
      <View style={{ padding: 24, paddingTop: 32, gap: 16, flex: 1 }}>
        <Copy size={24} bold>
          Who’s using Wise today?
        </Copy>
        <View style={{ marginTop: 8, gap: 12 }}>
          <Pill onPress={() => select('maria')}>{"I'm Maria (Lite user)"}</Pill>
          <Pill tone="pale" onPress={() => select('nikita')}>
            {"I'm Nikita (Helper)"}
          </Pill>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingTop: 6,
          }}
        >
          <Avatar initials="MA" size={32} />
          <ArrowRight size={16} color={c.muted} />
          <Avatar initials="NG" size={32} />
          <Copy size={15} color={c.muted}>
            Better, together.
          </Copy>
        </View>
        <Copy size={12} color={c.muted} style={{ textAlign: 'center' }}>
          Hackathon prototype · No real money moves
        </Copy>
      </View>
    </Screen>
  );
}
export default RolePicker;
