import type { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Linking,
  type TextStyle,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Label, FieldError } from 'heroui-native';
import {
  ChevronRight,
  Plus,
  ShieldCheck,
  Phone,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Svg, Path, Circle } from '@/components/ui/primitives/Svg';
import { wise as c } from '@/lib/wise-theme';
import { useWise, recipients, money, dayLabel, type Transfer } from '@/lib/wise-store';

export function Copy({
  children,
  size = 20,
  bold = false,
  color = c.text,
  style,
  ...props
}: Pick<TextProps, 'numberOfLines' | 'maxFontSizeMultiplier'> & {
  children: ReactNode;
  size?: number;
  bold?: boolean;
  color?: string;
  style?: TextStyle;
}) {
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: bold ? 'Inter_600SemiBold' : 'Inter_400Regular',
          fontSize: size,
          lineHeight: size * 1.4,
          color,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Heading({
  children,
  compact = false,
  center = false,
}: {
  children: ReactNode;
  compact?: boolean;
  center?: boolean;
}) {
  return (
    <Copy
      size={compact ? 28 : 32}
      bold
      style={{
        lineHeight: compact ? 34 : 39,
        letterSpacing: -1.2,
        textAlign: center ? 'center' : undefined,
      }}
    >
      {children}
    </Copy>
  );
}
export function Statement({
  children,
  color = c.forest,
  size = 48,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
}) {
  return (
    <Text
      style={{
        fontFamily: 'Anton_400Regular',
        fontSize: size,
        lineHeight: size * 1.08,
        color,
        textAlign: 'center',
        letterSpacing: -0.5,
      }}
    >
      {children}
    </Text>
  );
}
export function Pill({
  children,
  onPress,
  tone = 'green',
  icon: Icon,
  small = false,
  dense = false,
  disabled = false,
  loading = false,
}: {
  children: string;
  onPress: () => void;
  tone?: 'green' | 'pale' | 'dark' | 'white' | 'danger';
  icon?: LucideIcon;
  small?: boolean;
  dense?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  const bg =
    tone === 'dark'
      ? c.forest
      : tone === 'pale'
        ? c.pale
        : tone === 'white' || tone === 'danger'
          ? c.white
          : c.green;
  const color = tone === 'dark' ? c.green : tone === 'danger' ? c.dangerText : c.forest;
  return (
    <Button
      onPress={onPress}
      isDisabled={disabled || loading}
      className="rounded-full"
      style={{
        minHeight: small ? 44 : 64,
        height: 'auto',
        paddingHorizontal: dense ? 8 : small ? 14 : 22,
        gap: dense ? 5 : 8,
        paddingVertical: small ? 10 : 16,
        backgroundColor: bg,
        borderWidth: tone === 'white' || tone === 'danger' ? 1 : 0,
        borderColor: tone === 'danger' ? c.danger : c.border,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {Icon ? <Icon size={dense ? 16 : small ? 18 : 22} strokeWidth={1.8} color={color} /> : null}
      <Button.Label
        numberOfLines={small ? 1 : undefined}
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: dense ? 13 : small ? 15 : 20,
          color,
          textAlign: 'center',
          flexShrink: 1,
        }}
      >
        {loading ? 'Please wait…' : children}
      </Button.Label>
    </Button>
  );
}
export function Screen({
  children,
  footer,
  color = c.white,
  safe = false,
  style,
}: {
  children: ReactNode;
  footer?: ReactNode;
  color?: string;
  safe?: boolean;
  style?: ViewStyle;
}) {
  const offline = useWise((s) => s.offline);
  return (
    <SafeAreaView
      edges={safe ? ['top', 'bottom'] : ['bottom']}
      style={{ flex: 1, backgroundColor: color }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        {offline ? (
          <View
            style={{ backgroundColor: c.dangerPale, paddingVertical: 8, paddingHorizontal: 24 }}
          >
            <Copy size={14} bold color={c.dangerText}>
              No connection to the server. Changes can’t be saved.
            </Copy>
          </View>
        ) : null}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[{ padding: 24, gap: 24, flexGrow: 1 }, style]}
        >
          {children}
        </ScrollView>
        {footer ? <View style={{ padding: 24, paddingTop: 12, gap: 12 }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function WiseMark({ size = 26, color = c.forest }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path fill={color} d="M3 5h15l-5 7h9L11 28H4l8-12H4l6-7H3zm18 0h8L15 28h-5L24 9h-6z" />
    </Svg>
  );
}
export function Avatar({
  initials,
  size = 54,
  badge = false,
  background = c.card,
}: {
  initials: string;
  size?: number;
  badge?: boolean;
  background?: string;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Copy bold size={size * 0.31} color={c.forest}>
          {initials}
        </Copy>
      </View>
      {badge ? (
        <View
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: 22,
            height: 22,
            borderRadius: 20,
            backgroundColor: c.green,
            borderWidth: 2,
            borderColor: c.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <WiseMark size={12} />
        </View>
      ) : null}
    </View>
  );
}
export function IconCircle({
  icon: Icon,
  plus = false,
  size = 56,
  color = c.forest,
  background = c.card,
}: {
  icon: LucideIcon;
  plus?: boolean;
  size?: number;
  color?: string;
  background?: string;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Icon size={size * 0.46} color={color} strokeWidth={1.8} />
      </View>
      {plus ? (
        <View
          style={{
            position: 'absolute',
            right: -2,
            bottom: -1,
            backgroundColor: c.green,
            borderRadius: 20,
            padding: 3,
            borderWidth: 2,
            borderColor: c.white,
          }}
        >
          <Plus size={13} color={c.forest} strokeWidth={2} />
        </View>
      ) : null}
    </View>
  );
}
export function TopBar({ helper = false, full = false }: { helper?: boolean; full?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <Pressable onPress={() => router.push('/roles')} accessibilityLabel="Switch demo role">
        <Avatar initials={helper ? 'NG' : 'MA'} size={48} />
      </Pressable>
      <Pressable
        onPress={() =>
          full
            ? router.push({ pathname: '/demo-note', params: { title: 'Earn €150' } })
            : router.push('/rules')
        }
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: c.green,
          borderRadius: 99,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        {!full ? <ShieldCheck color={c.forest} size={18} strokeWidth={1.8} /> : null}
        <Copy bold size={13} color={c.forest} numberOfLines={1}>
          {full ? 'Earn €150' : helper ? 'Trusted Helper' : 'Protected by Nikita'}
        </Copy>
      </Pressable>
    </View>
  );
}
export function Row({
  title,
  subtitle,
  initials,
  trailing,
  onPress,
  compact = false,
  badge = false,
  activity = false,
}: {
  title: string;
  subtitle?: string;
  initials: string;
  trailing?: ReactNode;
  onPress?: () => void;
  compact?: boolean;
  badge?: boolean;
  activity?: boolean;
}) {
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: compact || activity ? 12 : 16,
        paddingVertical: compact || activity ? 14 : 20,
      }}
    >
      <Avatar
        initials={initials}
        size={compact || activity ? 44 : 56}
        badge={badge}
        background={activity && !compact ? c.white : c.card}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Copy size={compact ? 16 : 20} bold>
          {title}
        </Copy>
        {subtitle ? (
          <Copy size={compact ? 13 : activity ? 14 : 16} color={c.muted}>
            {subtitle}
          </Copy>
        ) : null}
      </View>
      {trailing}
      <ChevronRight size={compact || activity ? 17 : 22} color={c.forest} strokeWidth={1.8} />
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  ) : (
    content
  );
}
export function DashedCard({
  title,
  icon: Icon,
  onPress,
  children,
  compact = false,
  trailing,
}: {
  title: string;
  icon: LucideIcon;
  onPress?: () => void;
  children?: ReactNode;
  compact?: boolean;
  trailing?: ReactNode;
}) {
  const card = (
    <View
      style={{
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: c.border,
        borderRadius: 24,
        padding: compact ? 18 : 22,
        gap: 18,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <IconCircle icon={Icon} plus size={compact ? 44 : 54} />
        <Copy bold size={compact ? 17 : 20} style={{ flex: 1 }}>
          {title}
        </Copy>
        {trailing}
        {onPress ? <ChevronRight size={22} color={c.forest} strokeWidth={1.8} /> : null}
      </View>
      {children}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button">
      {card}
    </Pressable>
  ) : (
    card
  );
}
export function GreyCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ backgroundColor: c.card, borderRadius: 24, padding: 24, gap: 16 }, style]}>
      {children}
    </View>
  );
}
export function StatusChip({
  status,
  incoming = false,
}: {
  status: Transfer['status'];
  incoming?: boolean;
}) {
  const danger = status === 'blocked' || status === 'declined';
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: danger ? c.dangerPale : status === 'pending' ? c.yellow : c.pale,
        borderRadius: 99,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Copy size={12} bold color={danger ? c.dangerText : c.forest} numberOfLines={1}>
        {incoming
          ? 'Received'
          : status === 'pending'
            ? 'Waiting'
            : status[0].toUpperCase() + status.slice(1)}
      </Copy>
    </View>
  );
}
export function TransferRow({
  transfer,
  helper = false,
}: {
  transfer: Transfer;
  helper?: boolean;
}) {
  const sent = transfer.status === 'sent' || transfer.status === 'approved';
  const incoming = transfer.direction === 'incoming';
  const person = incoming ? (transfer.sender ?? recipients[0]) : transfer.recipient;
  return (
    <Row
      title={incoming ? `From ${person.name}` : person.name}
      initials={person.initials}
      compact={helper}
      activity
      subtitle={
        helper
          ? dayLabel(transfer.createdAt)
          : `${incoming ? 'Received' : sent ? 'Sent' : transfer.status === 'pending' ? 'Waiting' : 'Not sent'} · ${dayLabel(transfer.createdAt)}`
      }
      trailing={
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Copy size={helper ? 16 : 18} bold>
            {incoming ? '+' : sent ? '−' : ''}
            {money(transfer.amount)}
          </Copy>
          {helper ? <StatusChip status={transfer.status} incoming={incoming} /> : null}
        </View>
      }
      onPress={() =>
        router.push({
          pathname: helper && !incoming ? '/approval' : '/result',
          params: { id: transfer.id },
        })
      }
    />
  );
}
export function EUFlag() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30">
      <Circle cx={15} cy={15} r={15} fill={c.euro} />
      {Array.from({ length: 12 }, (_, i) => (
        <Circle
          key={i}
          cx={15 + Math.cos((i * Math.PI) / 6) * 8}
          cy={15 + Math.sin((i * Math.PI) / 6) * 8}
          r={1}
          fill={c.star}
        />
      ))}
    </Svg>
  );
}
export function Calculator({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <View style={{ gap: 20 }}>
      <GreyCard style={{ padding: 16 }}>
        <Label>
          <Label.Text style={{ fontSize: 16, color: c.muted, fontFamily: 'Inter_400Regular' }}>
            You send
          </Label.Text>
        </Label>
        <View
          style={{
            backgroundColor: c.white,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            minHeight: 96,
            gap: 12,
          }}
        >
          <Input
            accessibilityLabel="Amount in euros"
            value={value}
            onChangeText={onChange}
            keyboardType="decimal-pad"
            placeholder="0"
            className="bg-transparent"
            style={{
              flex: 1,
              fontSize: 40,
              fontFamily: 'Inter_600SemiBold',
              color: c.text,
              paddingHorizontal: 0,
              minWidth: 0,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <EUFlag />
            <Copy bold size={16}>
              Euro
            </Copy>
          </View>
        </View>
        <Copy size={14} color={c.muted}>
          Includes fees 0,00 € | Arrives in seconds
        </Copy>
      </GreyCard>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[20, 50, 100].map((amount) => (
          <View key={amount} style={{ flex: 1 }}>
            <Pill
              small
              tone="pale"
              onPress={() => {
                onChange(String(amount));
                void Haptics.selectionAsync();
              }}
            >
              {money(amount)}
            </Pill>
          </View>
        ))}
      </View>
      {error ? <ErrorCopy>{error}</ErrorCopy> : null}
    </View>
  );
}
export function ErrorCopy({ children }: { children: string }) {
  return (
    <FieldError
      isInvalid
      styles={{ text: { color: c.dangerText, fontSize: 16, fontFamily: 'Inter_400Regular' } }}
    >
      {children}
    </FieldError>
  );
}
export function Empty({
  icon: Icon,
  children,
  action,
  onPress,
}: {
  icon: LucideIcon;
  children: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 16, paddingVertical: 24 }}>
      <Icon size={36} color={c.forest} strokeWidth={1.8} />
      <Copy size={17} style={{ textAlign: 'center' }}>
        {children}
      </Copy>
      <Pill tone="pale" small onPress={onPress}>
        {action}
      </Pill>
    </View>
  );
}
export function callPerson(helper = false) {
  void Linking.openURL(`tel:${helper ? '+447700900147' : '+447700900148'}`).catch(() => {});
}
export const styles = StyleSheet.create({
  // eslint-disable-next-line react-native/no-unused-styles -- Exported shared style used by app/send.tsx and app/rules.tsx.
  divider: { borderBottomWidth: 1, borderBottomColor: c.border },
  // eslint-disable-next-line react-native/no-unused-styles -- Exported shared style used by app/send.tsx.
  section: { gap: 16 },
  // eslint-disable-next-line react-native/no-unused-styles -- Public shared style retained for consumers of this module.
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 28 },
  // eslint-disable-next-line react-native/no-unused-styles -- Exported shared style used by app/send.tsx.
  alert: { backgroundColor: c.yellow, borderRadius: 24, padding: 24, gap: 20 },
  // eslint-disable-next-line react-native/no-unused-styles -- Exported shared input style used by app/send.tsx.
  field: {
    fontSize: 20,
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: c.card,
    color: c.text,
    fontFamily: 'Inter_400Regular',
  },
});
export { ShieldCheck, Phone, ArrowUpRight };
