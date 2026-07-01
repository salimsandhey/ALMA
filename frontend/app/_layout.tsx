import { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import SplashScreen from '../components/SplashScreen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { getToken, deleteToken, saveToken } from '../lib/storage'
import { useAuthStore } from '../stores/authStore'
import { useVoiceStore } from '../stores/voiceStore'
import { api } from '../lib/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
    },
  },
})

export default function RootLayout() {
  const { token, user, greetingDoneToday, setGreetingDone } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()
  const [booting, setBooting] = useState(true)
  const [splashVisible, setSplashVisible] = useState(true)

  useEffect(() => {
    useVoiceStore.getState().loadVoiceGender()
  }, [])

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const savedToken = await getToken()
        if (!savedToken) return

        // Retry /me up to 2 times — handles brief network unavailability on cold start
        let me = null
        let lastError: any = null
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const { data } = await api.get('/api/users/me', {
              headers: { Authorization: `Bearer ${savedToken}` },
            })
            me = data
            break
          } catch (err: any) {
            lastError = err
            // 401 means token is definitely invalid — no point retrying
            if (err?.response?.status === 401) break
            // Brief pause before second attempt
            if (attempt === 0) await new Promise((r) => setTimeout(r, 1500))
          }
        }

        if (me) {
          useAuthStore.getState().setAuth(savedToken, me)
          const today = new Date().toISOString().split('T')[0]
          useAuthStore.getState().setGreetingDone(me.lastGreetingDate === today)
        } else if (lastError?.response?.status === 401) {
          // Token is expired/invalid — force logout
          await deleteToken()
          useAuthStore.getState().clearAuth()
        }
        // Network/server errors after retries: token stays in storage,
        // nav guard shows login screen, but next cold start will retry cleanly
      } finally {
        setBooting(false)
      }
    }

    bootstrapAuth()
  }, [])


  useEffect(() => {
    if (booting) return

    const currentRoot = segments[0]

    const SHARED_SCREENS = [
      'module', 'lesson', 'music', 'coach', 'warmup',
      'badges', 'edit-profile',
      'feedback', 'how-to-use', 'terms-privacy', 'intro-slides', 'dev-screens',
      'daily-greeting', 'coach-chat', 'daily-challenge', 'entertainment',
      'auth',
    ]

    if (!token || !user) {
      // Allow the Google OAuth callback route through — it handles its own auth
      if (currentRoot !== '(auth)' && currentRoot !== 'auth') {
        router.replace('/(auth)/login')
      }
      return
    }

    if (!user.isOnboardingComplete) {
      if (currentRoot !== '(onboarding)') router.replace('/(onboarding)/name')
      return
    }

    if (SHARED_SCREENS.includes(currentRoot as string)) return

    // Allow newly-onboarded users to finish the complete → slides flow
    if (currentRoot === '(onboarding)') return

    if (user.role === 'ADMIN') {
      if (currentRoot !== '(admin)') router.replace('/(admin)/overview')
      return
    }

    // Students: show daily greeting once per day before home
    if (!greetingDoneToday && currentRoot !== 'daily-greeting') {
      router.replace('/daily-greeting')
      return
    }

    if (currentRoot !== '(student)') {
      router.replace('/(student)/home')
    }
  }, [booting, greetingDoneToday, router, segments, token, user])

  if (splashVisible) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SplashScreen ready={!booting} onFinish={() => setSplashVisible(false)} />
      </GestureHandlerRootView>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
