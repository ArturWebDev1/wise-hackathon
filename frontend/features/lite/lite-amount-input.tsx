import { Pressable, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Coins, Zap } from 'lucide-react-native';
import { Copy, ErrorCopy, EUFlag } from '@/components/wise';
import { money } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';

type LiteAmountInputProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  hint?: string;
  showTransferDetails?: boolean;
  cardTone?: 'white' | 'gray';
  error?: string;
};

export function LiteAmountInput({
  value,
  onChange,
  label,
  hint,
  showTransferDetails = false,
  cardTone = 'white',
  error,
}: LiteAmountInputProps) {
  const selectedAmount = Number(value.replace(',', '.'));
  return (
    <View style={{ gap: 20 }}>
      <View
        style={{
          gap: 18,
          padding: 20,
          backgroundColor: cardTone === 'gray' ? c.card : c.white,
          borderWidth: 1,
          borderColor: c.pale,
          borderRadius: 24,
        }}
      >
        <Copy size={16} color={c.muted}>
          {label}
        </Copy>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 86 }}>
          <TextInput
            accessibilityLabel="Amount in euros"
            value={value}
            onChangeText={onChange}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={c.muted}
            selectionColor={c.forest}
            style={{
              flex: 1,
              minWidth: 0,
              padding: 0,
              backgroundColor: 'transparent',
              fontSize: 56,
              fontFamily: 'Inter_600SemiBold',
              color: c.text,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <EUFlag />
            <Copy bold size={16}>
              Euro
            </Copy>
          </View>
        </View>
        {showTransferDetails ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Zap size={18} color={c.forest} />
              <Copy size={13} color={c.muted}>
                Arrives in seconds
              </Copy>
            </View>
            <View style={{ width: 1, height: 24, backgroundColor: c.border }} />
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Coins size={18} color={c.forest} />
              <Copy size={13} color={c.muted}>
                Includes fees 0,00 €
              </Copy>
            </View>
          </View>
        ) : hint ? (
          <Copy size={14} color={c.muted}>
            {hint}
          </Copy>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[20, 50, 100].map((amount) => {
          const selected = selectedAmount === amount;
          return (
            <Pressable
              key={amount}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                onChange(String(amount));
                void Haptics.selectionAsync();
              }}
              style={{
                flex: 1,
                minHeight: 48,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 24,
                backgroundColor: c.pale,
                borderWidth: selected ? 2 : 0,
                borderColor: c.forest,
              }}
            >
              <Copy bold size={16} color={c.forest}>
                {money(amount)}
              </Copy>
            </Pressable>
          );
        })}
      </View>
      {error ? <ErrorCopy>{error}</ErrorCopy> : null}
    </View>
  );
}
