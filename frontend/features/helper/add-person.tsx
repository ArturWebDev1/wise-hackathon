import { useState } from 'react';
import { View, Share } from 'react-native';
import { Input, Label, Slider, Switch } from 'heroui-native';
import { Check, Send, SlidersHorizontal, UserRoundPlus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Heading,
  Copy,
  Pill,
  DashedCard,
  GreyCard,
  IconCircle,
  ErrorCopy,
  styles,
} from '@/components/wise';
import { money } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';
import { Detail } from './detail';
import { HelperOnly, goBack } from './helper-only';
import { usePeople } from './people-store';

type Stage = 'who' | 'rules' | 'invite' | 'done';
const RELATIONSHIPS = ['Mom', 'Dad', 'Grandma', 'Grandpa', 'Other'];

export function AddPerson() {
  const add = usePeople((s) => s.add);
  const [stage, setStage] = useState<Stage>('who');
  const [name, setName] = useState('');
  const [choice, setChoice] = useState('Mom');
  const [other, setOther] = useState('');
  const [limit, setLimit] = useState(250);
  const [checkNew, setCheckNew] = useState(true);
  const [error, setError] = useState('');
  const person = name.trim();
  const relationship = choice === 'Other' ? other.trim() : choice;
  const toRules = () => {
    if (!person || !relationship) {
      setError(person ? 'Write who they are to you.' : 'Enter the person’s name.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError('');
    setStage('rules');
  };
  const sendInvite = () => {
    add({ name: person, relationship, limit, checkNew });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStage('done');
    // The share sheet is a bonus: it may never answer on desktop browsers, so nothing waits for it.
    Share.share({
      message: `Hi ${person}, Nikita invited you to Wise Lite so he can help keep your money safe. Wise Lite hackathon demo — no real money. https://example.com/wise-lite/invite/${encodeURIComponent(person.toLowerCase())}`,
    }).catch(() => {});
  };
  const back = (to: Stage) => <Pill tone="white" onPress={() => setStage(to)}>Back</Pill>;
  if (stage === 'done')
    return (
      <HelperOnly>
        <Screen
          safe
          footer={
            <Pill tone="dark" onPress={goBack}>
              Back to family
            </Pill>
          }
          style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 48, gap: 16 }}
        >
          <IconCircle icon={Check} size={88} background={`${c.green}99`} color={c.forest} />
          <Heading center>Invite sent.</Heading>
          <Copy size={17} color={c.muted} style={{ textAlign: 'center' }}>
            {`${person} gets a link that works for 24 hours.`}
          </Copy>
        </Screen>
      </HelperOnly>
    );
  return (
    <HelperOnly>
      {stage === 'who' ? (
        <Screen footer={<Pill onPress={toRules}>Continue</Pill>}>
          <Heading>Who do you want to protect?</Heading>
          <View style={styles.section}>
            <Label>
              <Label.Text style={{ fontSize: 20, fontFamily: 'Inter_600SemiBold' }}>
                Full name
              </Label.Text>
            </Label>
            <Input
              value={name}
              onChangeText={(v) => {
                setName(v);
                setError('');
              }}
              placeholder="Name of the person"
              autoCapitalize="words"
              style={styles.field}
            />
          </View>
          <View style={styles.section}>
            <Copy size={20} bold>
              Who are they to you?
            </Copy>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {RELATIONSHIPS.map((r) => (
                <Pill
                  key={r}
                  small
                  tone={choice === r ? 'green' : 'pale'}
                  onPress={() => {
                    setChoice(r);
                    setError('');
                  }}
                >
                  {r}
                </Pill>
              ))}
            </View>
          </View>
          {choice === 'Other' ? (
            <View style={styles.section}>
              <Label>
                <Label.Text style={{ fontSize: 20, fontFamily: 'Inter_600SemiBold' }}>
                  Who are they?
                </Label.Text>
              </Label>
              <Input
                value={other}
                onChangeText={(v) => {
                  setOther(v);
                  setError('');
                }}
                placeholder="For example: uncle, neighbour, friend"
                autoCapitalize="sentences"
                style={styles.field}
              />
            </View>
          ) : null}
          {error ? <ErrorCopy>{error}</ErrorCopy> : null}
        </Screen>
      ) : stage === 'rules' ? (
        <Screen
          footer={
            <View style={{ gap: 12 }}>
              <Pill onPress={() => setStage('invite')}>Continue</Pill>
              {back('who')}
            </View>
          }
        >
          <Heading>Set the safety net</Heading>
          <DashedCard title={`Ask me above ${money(limit)}`} icon={SlidersHorizontal} compact>
            <Slider
              value={limit}
              minValue={50}
              maxValue={1000}
              step={50}
              onChange={(value) => setLimit(Array.isArray(value) ? value[0] : value)}
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
          </DashedCard>
          <DashedCard
            title="Ask me for any new person"
            icon={UserRoundPlus}
            compact
            trailing={
              <Switch
                accessibilityLabel="Ask for any new person"
                isSelected={checkNew}
                onSelectedChange={setCheckNew}
              />
            }
          />
          <Copy size={16} color={c.muted}>
            You can change this any time in Protection rules.
          </Copy>
        </Screen>
      ) : (
        <Screen
          footer={
            <View style={{ gap: 12 }}>
              <Pill icon={Send} onPress={sendInvite}>
                Send invite
              </Pill>
              {back('rules')}
            </View>
          }
        >
          <Heading>{`Invite ${person}?`}</Heading>
          <GreyCard style={{ padding: 20, gap: 12 }}>
            <Detail label="Who" value={`${person} · ${relationship}`} bold />
            <Detail label="Ask me above" value={money(limit)} />
            <Detail label="New people" value={checkNew ? 'Ask me' : 'Don’t ask'} />
          </GreyCard>
          <Copy size={16} color={c.muted}>
            {`${person} gets a link for 24 hours. They confirm it’s them and agree that you protect them.`}
          </Copy>
        </Screen>
      )}
    </HelperOnly>
  );
}
