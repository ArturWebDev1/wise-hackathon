import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { Empty } from '@/components/wise';
import { useWise } from '@/lib/wise-store';

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.dismissTo('/');
}

/** Mode is not identity: Maria can open full Wise, but only Nikita sees family protection. */
export function HelperOnly({ children }: { children: ReactNode }) {
  const role = useWise((s) => s.role);
  if (role !== 'nikita')
    return (
      <Empty icon={ShieldCheck} action="Back" onPress={goBack}>
        Only Nikita can open family protection.
      </Empty>
    );
  return <>{children}</>;
}
