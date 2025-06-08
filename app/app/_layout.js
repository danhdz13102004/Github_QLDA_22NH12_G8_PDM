// SignLanguage/app/app/_layout.js
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ToastProvider } from '../contexts/ToastContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auths)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
