import { Redirect } from 'expo-router'

export default function AuthIndex() {
  // Ensure the first screen for unauthenticated users is always Login.
  return <Redirect href="/(auth)/login" />
}

