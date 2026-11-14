import { Stack } from 'expo-router';
import { Screen } from '@/components/wise';
import { FamilyHub } from '@/features/helper/family-hub';

export default function Family() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Family protection', headerRight: () => null }} />
      <FamilyHub />
    </Screen>
  );
}
