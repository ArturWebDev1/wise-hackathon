import { useState } from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Slider } from 'heroui-native';
import { SlidersHorizontal, UserRoundPlus, ShieldCheck } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Copy, ErrorCopy, GreyCard, Pill } from '@/components/wise';
import { useWise, recipients, money } from '@/lib/wise-store';
import type { RuleKey } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { RingAvatar, RingIcon, dashed, ink, rowBg } from '@/features/fullwise/parts';
import { H1, Page } from '@/features/helper/page';
import { WiseSwitch } from '@/features/helper/wise-switch';

const hoursLeft = (time: number) => Math.max(1, Math.ceil((time - Date.now()) / 3600000));

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
  const rule = (key: RuleKey, on: boolean) => ({
    control: (
      <WiseSwitch
        accessibilityLabel={key}
        isSelected={on && !scheduled[key]}
        isDisabled={!helper}
        onSelectedChange={(value) => change(toggleRule(key, value))}
      />
    ),
    offAt: scheduled[key],
    keepOn: () => change(toggleRule(key, true)),
  });
  const limitRule = rule('limit', enabledLimit);
  const newRule = rule('checkNew', checkNew);
  const pauseRule = rule('scamPause', scamPause);
  return (
    <Page>
      <H1>{helper ? 'A safety net for Mom.' : 'Nikita has your back.'}</H1>
      <View style={{ gap: 16 }}>
        <RuleCard
          icon={SlidersHorizontal}
          title={`Ask me above ${money(limit ?? 300)}`}
          rule={limitRule}
        >
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
        </RuleCard>
        <RuleCard icon={UserRoundPlus} title="Ask me for any new person" rule={newRule} />
        <RuleCard icon={ShieldCheck} title="Scam Pause" rule={pauseRule} />
      </View>
      <View style={{ gap: 12 }}>
        <Copy bold size={22} color={ink} style={{ letterSpacing: -0.6 }}>
          Manage favourites
        </Copy>
        <View
          style={{
            backgroundColor: c.card,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 4,
          }}
        >
          {recipients.map((r, index) => (
            <View
              key={r.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 14,
                borderBottomWidth: index < recipients.length - 1 ? 1 : 0,
                borderBottomColor: c.border,
              }}
            >
              <RingAvatar initials={r.initials} />
              <View style={{ flex: 1, gap: 1 }}>
                <Copy bold size={17} color={ink}>
                  {r.name}
                </Copy>
                <Copy size={15} color="#4A4A47">
                  {r.relationship}
                </Copy>
              </View>
              <WiseSwitch
                accessibilityLabel={`${r.name} is a favourite`}
                isSelected={favourites.includes(r.id)}
                isDisabled={!helper}
                onSelectedChange={() => change(toggleFavourite(r.id))}
              />
            </View>
          ))}
        </View>
      </View>
      {error ? <ErrorCopy>{error}</ErrorCopy> : null}
      <GreyCard style={{ padding: 16, gap: 8 }}>
        <Copy size={14} color={c.muted}>
          Turning protection off takes 24 hours, so scammers can’t make Mom switch it off.
        </Copy>
        {!helper ? (
          <Copy size={14} bold color={c.forest}>
            Only Nikita can change these rules.
          </Copy>
        ) : null}
      </GreyCard>
    </Page>
  );
}

function RuleCard({
  icon,
  title,
  rule,
  children,
}: {
  icon: LucideIcon;
  title: string;
  rule: { control: ReactNode; offAt?: number; keepOn: () => void };
  children?: ReactNode;
}) {
  return (
    <View
      style={{
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: dashed,
        borderRadius: 20,
        backgroundColor: rowBg,
        padding: 16,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <RingIcon icon={icon} plus />
        <Copy bold size={17} color={ink} style={{ flex: 1 }}>
          {title}
        </Copy>
        {rule.control}
      </View>
      {children}
      {rule.offAt ? (
        <View style={{ backgroundColor: c.yellow, borderRadius: 14, padding: 14, gap: 10 }}>
          <Copy size={15} bold color={c.yellowText}>
            {`Turns off in ${hoursLeft(rule.offAt)} h`}
          </Copy>
          <Copy size={14} color={c.yellowText}>
            Protection stays on until then.
          </Copy>
          <Pill small tone="white" onPress={rule.keepOn}>
            Keep it on
          </Pill>
        </View>
      ) : null}
    </View>
  );
}
