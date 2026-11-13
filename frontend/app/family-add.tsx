import { Stack } from 'expo-router';
import { AddPerson } from '@/features/helper/add-person';

export default function FamilyAdd() {
  return (
    <>
      <Stack.Screen options={{ title: 'Add someone' }} />
      <AddPerson />
    </>
  );
}
