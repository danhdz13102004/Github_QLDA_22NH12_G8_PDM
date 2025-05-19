// SignLanguage/app/app/(auths)/index.js
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the login screen by default
  return <Redirect href="/login" />;
}
