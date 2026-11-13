import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Copy } from '@/components/wise';
import { wise as c } from '@/lib/wise-theme';

export function LiteCloseButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close"
      onPress={() => router.dismissTo('/')}
      style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
    >
      <Copy size={16} bold color={c.forest}>
        Close
      </Copy>
    </Pressable>
  );
}
