import { Image, View } from 'react-native';
import { Luggage } from 'lucide-react-native';
import { Copy } from '@/components/wise';
import { BigPill, Chip, FullPage, display } from './parts';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- bundled image, no module typing in this project
const globeCard: number = require('./images/globe-card.jpg');

export function FullCards() {
  return (
    <FullPage
      header={<Chip icon={Luggage} label="Travel hub" />}
      footer={<BigPill>Order a debit card</BigPill>}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24 }}>
        <Image
          source={globeCard}
          style={{ width: 280, height: 244 }}
          resizeMode="contain"
          accessibilityLabel="Wise card"
        />
        <Copy size={40} style={{ ...display, lineHeight: 42, textAlign: 'center' }}>
          {'GLOBAL SPENDING\nMADE SIMPLE'}
        </Copy>
        <Copy size={16} color="#4A4A47" style={{ textAlign: 'center', paddingHorizontal: 8 }}>
          Spend abroad and at home. No markups, no transaction fees.
        </Copy>
      </View>
    </FullPage>
  );
}
