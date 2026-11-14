import { Stack } from 'expo-router';
import { Screen } from '@/components/wise';
import { RequestsList } from '@/features/helper/requests-list';

export default function Requests() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Requests', headerRight: () => null }} />
      <RequestsList />
    </Screen>
  );
}
