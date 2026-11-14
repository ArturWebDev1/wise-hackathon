import { View } from 'react-native';
import { Svg, Path, Circle } from '@/components/ui/primitives/Svg';
import { Copy } from '@/components/wise';
import { wise as c } from '@/lib/wise-theme';

// Hard-coded EUR/USD sample line, shaped like the real Wise calculator.
const POINTS = [
  75, 62, 40, 40, 48, 55, 46, 42, 52, 60, 60, 50, 66, 100, 80, 62, 72, 72, 75, 55, 38, 36, 52, 98,
  98, 92, 44, 72, 108, 138, 156,
];
const W = 300;
const H = 200;

export function RateChart() {
  const step = W / (POINTS.length - 1);
  const d = POINTS.map((y, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)} ${y}`).join(' ');
  const last = { x: W, y: POINTS[POINTS.length - 1] };
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Svg width="100%" height={H} viewBox={`0 0 ${W + 16} ${H}`}>
            {[20, 110, 190].map((y) => (
              <Path
                key={y}
                d={`M0 ${y} L${W} ${y}`}
                stroke="#C9C9C4"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ))}
            <Path d={d} stroke={c.forest} strokeWidth={3} fill="none" />
            <Circle cx={last.x} cy={last.y} r={14} fill="#C5C9C0" />
            <Circle cx={last.x} cy={last.y} r={6} fill={c.forest} />
          </Svg>
        </View>
        <View style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
          {['1,13', '1,11', '1,09'].map((t) => (
            <Copy key={t} size={17} color="#4A4A47">
              {t}
            </Copy>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: 48 }}>
        <Copy size={17} color="#4A4A47">
          15 Oct
        </Copy>
        <Copy size={17} color="#4A4A47">
          Today
        </Copy>
      </View>
    </View>
  );
}
