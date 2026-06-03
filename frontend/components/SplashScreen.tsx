import { useEffect, useRef } from 'react'
import { Animated, Image, StyleSheet, View } from 'react-native'

interface Props {
  ready: boolean
  onFinish: () => void
}

const MIN_DISPLAY_MS = 1800

export default function SplashScreen({ ready, onFinish }: Props) {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.85)).current
  const canDismiss = useRef(false)
  const minElapsed = useRef(false)

  const dismiss = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(onFinish)
  }

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()

    const timer = setTimeout(() => {
      minElapsed.current = true
      if (canDismiss.current) dismiss()
    }, MIN_DISPLAY_MS)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!ready) return
    canDismiss.current = true
    if (minElapsed.current) dismiss()
  }, [ready])

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1F4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 220,
  },
})
