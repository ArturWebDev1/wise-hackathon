import type { ReactNode } from 'react';
import { Copy, Screen } from '@/components/wise';
import { wise as c } from '@/lib/wise-theme';

/** A sub-screen of the full Wise: 16 pt gutters, a big heading in the page, nothing in the header. */
export function Page({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <Screen footer={footer} style={{ padding: 16, gap: 24 }}>
      {children}
    </Screen>
  );
}

export function H1({ children }: { children: string }) {
  return (
    <Copy bold size={30} color="#1A1A17" style={{ lineHeight: 36, letterSpacing: -1.2 }}>
      {children}
    </Copy>
  );
}

export function Sub({ children }: { children: string }) {
  return (
    <Copy size={16} color={c.muted}>
      {children}
    </Copy>
  );
}
