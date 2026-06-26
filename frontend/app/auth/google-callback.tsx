import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { saveToken, deleteToken } from '../../lib/storage'
import { useAuthStore } from '../../stores/authStore'
import { api } from '../../lib/api'
import { NAVY } from '../../constants/colors'

// Landing screen for the alma://auth/google-callback?token=... deep link.
// Expo Router renders this instead of the "Unmatched Route" 404 page.
// We process the token here and redirect to the correct screen.
export default function GoogleCallback() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const router = useRouter()

  useEffect(() => {
    if (!token || typeof token !== 'string') {
      router.replace('/(auth)/login')
      return
    }

    const handle = async () => {
      try {
        const { data: me } = await api.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        await saveToken(token)
        useAuthStore.getState().setAuth(token, me)

        const today = new Date().toISOString().split('T')[0]
        useAuthStore.getState().setGreetingDone(me.lastGreetingDate === today)

        if (!me.isOnboardingComplete) {
          router.replace('/(onboarding)/name')
        } else if (me.role === 'ADMIN') {
          router.replace('/(admin)/overview')
        } else {
          router.replace('/(student)/home')
        }
      } catch {
        await deleteToken()
        useAuthStore.getState().clearAuth()
        router.replace('/(auth)/login')
      }
    }

    handle()
  }, [token])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={NAVY} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
})
