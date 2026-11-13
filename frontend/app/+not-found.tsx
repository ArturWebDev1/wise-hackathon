import { Screen, Heading, Pill } from '@/components/wise';
import { router } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Heading>This screen isn’t available.</Heading>
      <Pill onPress={() => router.dismissTo('/')}>Home</Pill>
    </Screen>
  );
}
