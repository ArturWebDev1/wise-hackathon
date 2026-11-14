import { useLocalSearchParams } from 'expo-router';
import { Page } from '@/features/helper/page';
import { PersonScreen } from '@/features/helper/person-screen';

export default function FamilyPerson() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <Page>
      <PersonScreen id={id} />
    </Page>
  );
}
