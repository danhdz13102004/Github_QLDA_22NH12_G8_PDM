// SignLanguage/app/app/index.js
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the login screen when the app starts
  return <Redirect href="/(tabs)/Recognize" />;
}
