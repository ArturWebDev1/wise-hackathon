import type { ReactNode } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Copy, WiseMark } from '@/components/wise';
import { useWise } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { openDemo } from '@/features/helper/demo';

export const ring = '#C9C9C4';
export const dashed = '#D5D5D0';
export const rowBg = '#FAFAF8';
export const ink = '#1A1A17';

/** Sticky header on top, scrolling content below, like the real Wise tabs. */
export function FullPage({
  header,
  footer,
  children,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.white }}>
      {header ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>{header}</View>
      ) : null}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 24, flexGrow: 1 }}
      >
        {children}
      </ScrollView>
      {footer ? <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function useIsHelper() {
  return useWise((s) => s.role) === 'nikita';
}

/** Where "Send" goes: Nikita sends to Maria, Maria uses the Lite send flow. */
export function openSend(helper: boolean) {
  router.push(helper ? '/send-maria' : '/send');
}

export function HomeHeader() {
  const helper = useIsHelper();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Pressable onPress={() => router.push('/roles')} accessibilityLabel="Switch demo role">
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: c.card,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Copy bold size={17} color="#3B3B38">
            {helper ? 'NG' : 'MA'}
          </Copy>
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: -1,
              width: 11,
              height: 11,
              borderRadius: 6,
              backgroundColor: '#D03238',
              borderWidth: 2,
              borderColor: c.white,
            }}
          />
        </View>
      </Pressable>
      <Pressable
        onPress={() => openDemo('Earn €150')}
        accessibilityRole="button"
        style={{
          backgroundColor: c.green,
          borderRadius: 69,
          paddingHorizontal: 15,
          paddingVertical: 10,
        }}
      >
        <Copy bold size={14} color={c.forest}>
          Earn €150
        </Copy>
      </Pressable>
    </View>
  );
}

export function Chip({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
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
        backgroundColor: '#F0F0EC',
        borderRadius: 69,
        paddingHorizontal: 13,
        paddingVertical: 8,
        alignSelf: 'flex-start',
      }}
    >
      <Icon size={15} color="#3B3B38" strokeWidth={1.8} />
      <Copy bold size={14} color="#3B3B38">
        {label}
      </Copy>
    </Pressable>
  );
}

export function RingIcon({
  icon: Icon,
  plus = false,
  size = 48,
  background = 'transparent',
}: {
  icon: LucideIcon;
  plus?: boolean;
  size?: number;
  background?: string;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size,
          borderWidth: 1.5,
          borderColor: ring,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={size * 0.44} color={ink} strokeWidth={1.8} />
      </View>
      {plus ? (
        <View
          style={{
            position: 'absolute',
            right: -3,
            bottom: -1,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: c.green,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={13} color={c.forest} strokeWidth={2} />
        </View>
      ) : null}
    </View>
  );
}

export function RingAvatar({ initials, badge = true }: { initials: string; badge?: boolean }) {
  return (
    <View style={{ width: 50, height: 50 }}>
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          borderWidth: 1.5,
          borderColor: ring,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Copy bold size={21} color="#3B3B38">
          {initials}
        </Copy>
      </View>
      {badge ? (
        <View
          style={{
            position: 'absolute',
            right: -3,
            bottom: -1,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: c.green,
            borderWidth: 2,
            borderColor: c.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <WiseMark size={10} />
        </View>
      ) : null}
    </View>
  );
}

/** Dashed action card with a ringed icon and a green plus badge. */
export function WiseCard({
  title,
  text,
  icon,
  onPress,
  chevron = false,
  plus = true,
}: {
  title: string;
  text?: string;
  icon: LucideIcon;
  onPress: () => void;
  chevron?: boolean;
  plus?: boolean;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <View
        style={{
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: dashed,
          borderRadius: 20,
          backgroundColor: rowBg,
          padding: 15,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <RingIcon icon={icon} plus={plus} />
        <View style={{ flex: 1, gap: 3 }}>
          <Copy bold size={15} color={ink}>
            {title}
          </Copy>
          {text ? (
            <Copy size={12} color="#4A4A47">
              {text}
            </Copy>
          ) : null}
        </View>
        {chevron ? <ChevronRight size={17} color={c.forest} strokeWidth={1.8} /> : null}
      </View>
    </Pressable>
  );
}

export function BigPill({ children, onPress }: { children: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        backgroundColor: c.green,
        borderRadius: 69,
        minHeight: 45,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Copy bold size={15} color={c.forest}>
        {children}
      </Copy>
    </Pressable>
  );
}

export const display = {
  fontFamily: 'Anton_400Regular',
  color: '#101010',
  letterSpacing: -0.5,
} as const;
