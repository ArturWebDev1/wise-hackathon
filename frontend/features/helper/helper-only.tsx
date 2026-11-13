import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { router, type Href } from 'expo-router';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { Copy, Empty } from '@/components/wise';
import { useWise } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';

export function BackLink({ to }: { to: Href }) {
  return (
    <Pressable
      onPress={() => router.navigate(to)}
      accessibilityRole="button"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}
    >
      <ArrowLeft size={20} color={c.forest} strokeWidth={2} />
      <Copy bold size={16} color={c.forest}>
        Back
      </Copy>
    </Pressable>
  );
}

/** Mode is not identity: Maria can open full Wise, but only Nikita sees family protection. */
export function HelperOnly({ children }: { children: ReactNode }) {
  const role = useWise((s) => s.role);
  if (role !== 'nikita')
    return (
      <Empty icon={ShieldCheck} action="Back" onPress={() => router.navigate('/full/payments')}>
        Only Nikita can open family protection.
      </Empty>
    );
  return <>{children}</>;
}
