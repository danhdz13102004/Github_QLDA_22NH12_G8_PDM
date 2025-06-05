import { Stack } from 'expo-router';

export default function DictionaryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'ASL Dictionary' }} />
    </Stack>
  )
}