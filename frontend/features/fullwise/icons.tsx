import { Svg, Path, Circle } from '@/components/ui/primitives/Svg';

export type IconProps = { size?: number; color?: string; strokeWidth?: number };

/** Wise "Cards" tab icon: a card with a notch on the right edge. */
export function CardNotchIcon({ size = 24, color = '#000', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5h16a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M6 9h3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** Wise "Payments" tab icon: three nodes joined by arcs. */
export function PaymentsIcon({ size = 24, color = '#000', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={13.5} cy={5} r={2.3} stroke={color} strokeWidth={strokeWidth} />
      <Circle cx={5.5} cy={16.5} r={2.3} stroke={color} strokeWidth={strokeWidth} />
      <Circle cx={18.5} cy={17.5} r={2.3} stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M11.4 6.2C7.4 7.6 5.2 10.6 5.4 14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M8.1 18.6C10.6 20.4 14 20.6 16.2 18.8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M18.9 15.2C19 11.8 17.4 8.6 15.4 6.6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
