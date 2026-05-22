import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Linking from 'expo-linking'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { getToken, deleteToken, saveToken } from '../lib/storage'
import { useAuthStore } from '../stores/authStore'
import { api } from '../lib/api'

const queryClient = new QueryClient()

export default function RootLayout() {
  const { token, user } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const savedToken = await getToken()

        if (!savedToken) {
          return
        }

        const { data: me } = await api.get('/api/users/me', {
          headers: { Authorization: `Bearer ${savedToken}` },
        })

        useAuthStore.getState().setAuth(savedToken, me)
      } catch (error: any) {
        if (error?.response?.status === 401) {
          await deleteToken()
        }
        useAuthStore.getState().clearAuth()
      } finally {
        setBooting(false)
      }
    }

    bootstrapAuth()
  }, [])

  useEffect(() => {
    const handleAuthDeepLink = async (url: string) => {
      const parsed = Linking.parse(url)
      const path = parsed.path ?? ''
      const tokenParam = parsed.queryParams?.token
      const incomingToken = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam

      if (!url.startsWith('alma://auth/google-callback') && path !== 'auth/google-callback') {
        return
      }

      if (!incomingToken || typeof incomingToken !== 'string') {
        return
      }

      try {
        const { data: me } = await api.get('/api/users/me', {
          headers: { Authorization: `Bearer ${incomingToken}` },
        })

        await saveToken(incomingToken)
        useAuthStore.getState().setAuth(incomingToken, me)

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
      }
    }

    Linking.getInitialURL().then(url => {
      if (url) {
        handleAuthDeepLink(url)
      }
    })

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleAuthDeepLink(url)
    })

    return () => subscription.remove()
  }, [router])

  useEffect(() => {
    if (booting) return

    const currentRoot = segments[0]

    const SHARED_SCREENS = [
      'module', 'lesson', 'music', 'coach', 'warmup',
      'leaderboard', 'badges', 'edit-profile',
      'feedback', 'how-to-use', 'intro-slides',
    ]

    if (!token || !user) {
      if (currentRoot !== '(auth)') router.replace('/(auth)/login')
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

    if (currentRoot !== '(student)') {
      router.replace('/(student)/home')
    }
  }, [booting, router, segments, token, user])

  // Block ALL screen rendering until auth is resolved.
  // This prevents Expo Router from briefly flashing whatever screen it
  // restores from its navigation cache before the guard has a chance to run.
  if (booting) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: '#0B1F4B' }} />
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
