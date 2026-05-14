import { Redirect } from 'expo-router'
import { useAuthStore } from '../stores/authStore'

export default function Index() {
  const { token, user } = useAuthStore()

  if (!token || !user) return <Redirect href="/(auth)" />
  if (!user.isOnboardingComplete) return <Redirect href="/(onboarding)/name" />
  if (user.role === 'ADMIN') return <Redirect href="/(admin)/overview" />
  return <Redirect href="/(student)/home" />
}