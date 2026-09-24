import { Redirect } from 'expo-router';

/**
 * App entry point. Redirect to login so the app opens on login, not register.
 */
export default function IndexScreen() {
  return <Redirect href="/login" />;
}
