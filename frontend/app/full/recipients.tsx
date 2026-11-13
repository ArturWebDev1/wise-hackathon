import { router } from 'expo-router';
import { UserRoundPlus } from 'lucide-react-native';
import { Screen, Heading, Row, DashedCard } from '@/components/wise';
import { recipients } from '@/lib/wise-store';
export default function Recipients() {
  return (
    <Screen>
      <Heading>Recipients</Heading>
      {recipients.map((r) => (
        <Row
          key={r.id}
          title={r.name}
          subtitle="EUR account"
          initials={r.initials}
          compact
          badge
          onPress={() =>
            router.push({ pathname: '/send', params: { stage: 'amount', recipient: r.id } })
          }
        />
      ))}
      <DashedCard
        title="Add a recipient"
        icon={UserRoundPlus}
        compact
        onPress={() => router.push({ pathname: '/send', params: { stage: 'new' } })}
      />
    </Screen>
  );
}
