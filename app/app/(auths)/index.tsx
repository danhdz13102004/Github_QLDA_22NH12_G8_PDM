import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the sign-in screen when accessing the auth route
  return <Redirect href="/sign-in" />;
}
