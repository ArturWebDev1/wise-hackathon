import { useState } from 'react';
import { View } from 'react-native';
import { Switch, Slider } from 'heroui-native';
import { SlidersHorizontal, UserRoundPlus, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Heading,
  Copy,
  DashedCard,
  GreyCard,
  Avatar,
  ErrorCopy,
  styles,
} from '@/components/wise';
import { useWise, recipients, money } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';

export default function Rules() {
  const role = useWise((s) => s.role);
  const limit = useWise((s) => s.limit);
  const checkNew = useWise((s) => s.checkNew);
  const scamPause = useWise((s) => s.scamPause);
  const scheduled = useWise((s) => s.protectionOffAt);
  const favourites = useWise((s) => s.favouriteIds);
  const toggleRule = useWise((s) => s.toggleRule);
  const setLimit = useWise((s) => s.setLimit);
  const toggleFavourite = useWise((s) => s.toggleFavourite);
  const helper = role === 'nikita';
  const enabledLimit = limit !== null;
  const [error, setError] = useState('');
  const change = (action: Promise<void>) => {
    setError('');
    action
      .then(() => Haptics.selectionAsync())
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Your change wasn’t saved.'),
      );
  };
  const toggle = (key: 'limit' | 'checkNew' | 'scamPause', enabled: boolean) => {
    change(toggleRule(key, enabled));
  };
  return (
    <Screen>
      <Heading compact>{helper ? 'A safety net for Mom.' : 'Nikita has your back.'}</Heading>
      <DashedCard title={`Ask me above ${money(limit ?? 300)}`} icon={SlidersHorizontal} compact>
        <SwitchRow
          label="Transfer limit"
          accessibilityLabel="Check transfers above the limit"
          isSelected={enabledLimit && !scheduled.limit}
          isDisabled={!helper}
          onChange={(value) => toggle('limit', value)}
        />
        <Slider
          value={limit ?? 300}
          minValue={50}
          maxValue={1000}
          step={50}
          isDisabled={!helper || !enabledLimit}
          onChange={(value) => change(setLimit(Array.isArray(value) ? value[0] : value))}
          onChangeEnd={() => {
            void Haptics.selectionAsync();
          }}
        >
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Copy size={13} color={c.muted}>
            50 €
          </Copy>
          <Copy size={13} color={c.muted}>
            1 000 €
          </Copy>
        </View>
        {scheduled.limit ? (
          <Copy size={14} color={c.forest}>
            Protection stays on for 24 hours. Switch on to cancel.
          </Copy>
        ) : null}
      </DashedCard>
      <DashedCard title="Ask me for any new person" icon={UserRoundPlus} compact>
        <SwitchRow
          label="New recipients"
          accessibilityLabel="Ask for any new person"
          isSelected={checkNew && !scheduled.checkNew}
          isDisabled={!helper}
          onChange={(value) => toggle('checkNew', value)}
        />
        {scheduled.checkNew ? (
          <Copy size={14} color={c.forest}>
            Protection stays on for 24 hours. Switch on to cancel.
          </Copy>
        ) : null}
      </DashedCard>
      <DashedCard title="Scam Pause" icon={ShieldCheck} compact>
        <SwitchRow
          label="Check for pressure"
          accessibilityLabel="Scam Pause"
          isSelected={scamPause && !scheduled.scamPause}
          isDisabled={!helper}
          onChange={(value) => toggle('scamPause', value)}
        />
        {scheduled.scamPause ? (
          <Copy size={14} color={c.forest}>
            Scam Pause stays on for 24 hours.
          </Copy>
        ) : null}
      </DashedCard>
      <View>
        <Copy size={20} bold>
          Manage favourites
        </Copy>
        {recipients.map((r) => (
          <View
            key={r.id}
            style={[
              styles.divider,
              { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18 },
            ]}
          >
            <Avatar initials={r.initials} size={44} badge />
            <View style={{ flex: 1 }}>
              <Copy size={17} bold>
                {r.name}
              </Copy>
              <Copy size={14} color={c.muted}>
                {r.relationship}
              </Copy>
            </View>
            <Switch
              accessibilityLabel={`${r.name} is a favourite`}
              isSelected={favourites.includes(r.id)}
              isDisabled={!helper}
              onSelectedChange={() => change(toggleFavourite(r.id))}
            />
          </View>
        ))}
      </View>
      {error ? <ErrorCopy>{error}</ErrorCopy> : null}
      <GreyCard style={{ padding: 20 }}>
        <Copy size={15} color={c.muted}>
          Turning protection off takes 24 hours — so scammers can’t make Mom switch it off.
        </Copy>
        {!helper ? (
          <Copy size={15} color={c.forest}>
            Only Nikita can change these rules.
          </Copy>
        ) : null}
      </GreyCard>
    </Screen>
  );
}

function SwitchRow({
  label,
  accessibilityLabel,
  isSelected,
  isDisabled,
  onChange,
}: {
  label: string;
  accessibilityLabel: string;
  isSelected: boolean;
  isDisabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Copy size={16} color={c.muted}>
        {label}
      </Copy>
      <Switch
        accessibilityLabel={accessibilityLabel}
        isSelected={isSelected}
        isDisabled={isDisabled}
        onSelectedChange={onChange}
      />
    </View>
  );
}
