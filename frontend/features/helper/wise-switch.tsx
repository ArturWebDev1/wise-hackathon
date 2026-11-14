import { useEffect, useState } from 'react';
import { Animated, Pressable } from 'react-native';
import { wise as c } from '@/lib/wise-theme';

/**
 * Wise-style switch whose thumb slides to the right when it is on.
 * The stock heroui switch keeps the thumb on the left in both states, so it looked frozen.
 */
export function WiseSwitch({
  isSelected,
  onSelectedChange,
  isDisabled = false,
  accessibilityLabel,
}: {
  isSelected: boolean;
  onSelectedChange: (value: boolean) => void;
  isDisabled?: boolean;
  accessibilityLabel?: string;
}) {
  const [position] = useState(() => new Animated.Value(isSelected ? 1 : 0));
  useEffect(() => {
    Animated.timing(position, {
      toValue: isSelected ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [isSelected, position]);
  const left = position.interpolate({ inputRange: [0, 1], outputRange: [3, 23] });
  const track = position.interpolate({ inputRange: [0, 1], outputRange: ['#E4E4DF', c.green] });
  const thumb = position.interpolate({ inputRange: [0, 1], outputRange: [c.white, c.forest] });
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: isSelected, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={() => onSelectedChange(!isSelected)}
      style={{ opacity: isDisabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={{ width: 52, height: 32, borderRadius: 16, backgroundColor: track, justifyContent: 'center' }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            left,
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: thumb,
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
