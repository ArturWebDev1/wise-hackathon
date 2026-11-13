import { Stack, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/wise';
import { PersonScreen } from '@/features/helper/person-screen';

export default function FamilyPerson() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Family protection' }} />
      <PersonScreen id={id} />
    </Screen>
  );
}
