import { View } from 'react-native';
import { Copy } from '@/components/wise';
import { wise as c } from '@/lib/wise-theme';

export function Detail({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'baseline' }}>
      <Copy size={17} color={c.muted} style={{ width: 120 }}>
        {label}
      </Copy>
      <Copy size={bold ? 18 : 17} bold={bold} style={{ flex: 1 }}>
        {value}
      </Copy>
    </View>
  );
}
