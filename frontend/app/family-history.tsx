import { Stack } from 'expo-router';
import { Screen } from '@/components/wise';
import { HistoryList } from '@/features/helper/history-list';

export default function History() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Maria’s history' }} />
      <HistoryList />
    </Screen>
  );
}
