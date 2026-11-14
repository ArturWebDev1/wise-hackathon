import { View } from 'react-native';
import { Luggage } from 'lucide-react-native';
import { Copy, WiseMark } from '@/components/wise';
import { openDemo } from '@/features/helper/demo';
import { BigPill, Chip, FullPage, display } from './parts';

export function FullCards() {
  return (
    <FullPage
      header={<Chip icon={Luggage} label="Travel hub" onPress={() => openDemo('Travel hub')} />}
      footer={<BigPill onPress={() => openDemo('Order a debit card')}>Order a debit card</BigPill>}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        <View style={{ width: 210, height: 168, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: 154,
              height: 154,
              borderRadius: 77,
              backgroundColor: '#3AA3B8',
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: -21,
                bottom: -14,
                width: 105,
                height: 91,
                borderRadius: 56,
                backgroundColor: '#1E4F94',
                opacity: 0.8,
              }}
            />
            <View
              style={{
                position: 'absolute',
                right: -7,
                top: 14,
                width: 77,
                height: 63,
                borderRadius: 42,
                backgroundColor: '#3E9B62',
                opacity: 0.7,
              }}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              right: 0,
              top: 43,
              width: 154,
              height: 88,
              borderRadius: 7,
              backgroundColor: '#9FE870',
              padding: 10,
            }}
          >
            <View
              style={{ width: 24, height: 18, borderRadius: 4, backgroundColor: '#C9CFC2', marginTop: 20 }}
            />
            <View style={{ position: 'absolute', right: 10, top: 8, flexDirection: 'row', gap: 3 }}>
              <WiseMark size={15} />
              <Copy size={17} color="#163300" style={{ ...display, color: '#163300' }}>
                WISE
              </Copy>
            </View>
          </View>
        </View>
        <Copy
          size={38}
          style={{ ...display, lineHeight: 39, textAlign: 'center' }}
        >
          {'GLOBAL SPENDING\nMADE SIMPLE'}
        </Copy>
        <Copy size={15} color="#4A4A47" style={{ textAlign: 'center', paddingHorizontal: 6 }}>
          Spend abroad and at home. No markups, no transaction fees.
        </Copy>
      </View>
    </FullPage>
  );
}
