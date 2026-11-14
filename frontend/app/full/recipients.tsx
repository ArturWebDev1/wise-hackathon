import { router } from 'expo-router';
import { UserRoundPlus } from 'lucide-react-native';
import { Screen, Heading, Row, DashedCard } from '@/components/wise';
import { recipients, useWise } from '@/lib/wise-store';
import { openDemo } from '@/features/helper/demo';
export default function Recipients() {
  const helper = useWise((s) => s.role) === 'nikita';
  return (
    <Screen>
      <Heading>Recipients</Heading>
      {helper ? (
        <Row
          title="Maria"
          subtitle="EUR account"
          initials="MA"
          compact
          badge
          onPress={() => router.push('/send-maria')}
        />
      ) : (
        recipients.map((r) => (
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
        ))
      )}
      <DashedCard
        title="Add a recipient"
        icon={UserRoundPlus}
        compact
        onPress={() =>
          helper ? openDemo('Add a recipient') : router.push({ pathname: '/send', params: { stage: 'new' } })
        }
      />
    </Screen>
  );
}
