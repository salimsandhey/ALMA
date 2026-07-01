import React, { useState, useRef, useEffect } from 'react'
import { TouchableOpacity, View, Animated, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Audio, InterruptionModeIOS } from 'expo-av'
import { useVoiceStore } from '../stores/voiceStore'
import { getAudioUri } from '../lib/audioCache'

interface Props {
  text: string
  size?: number
  color?: string
  idleColor?: string
  style?: StyleProp<ViewStyle>
}

export default function TTSButton({
  text,
  size = 16,
  color = '#093373',
  idleColor = '#9CA3AF',
  style,
}: Props) {
  const voiceGender = useVoiceStore((s) => s.voiceGender)
  const [playing, setPlaying] = useState(false)
  const soundRef = useRef<Audio.Sound | null>(null)
  const bar1 = useRef(new Animated.Value(0.4)).current
  const bar2 = useRef(new Animated.Value(0.4)).current
  const bar3 = useRef(new Animated.Value(0.4)).current
  const animsRef = useRef<Animated.CompositeAnimation[]>([])

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync().catch(() => {}) }
  }, [])

  useEffect(() => {
    if (playing) {
      const bars = [bar1, bar2, bar3]
      const delays = [0, 160, 320]
      animsRef.current = bars.map((bar, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delays[i]),
            Animated.timing(bar, { toValue: 1, duration: 320, useNativeDriver: true }),
            Animated.timing(bar, { toValue: 0.25, duration: 320, useNativeDriver: true }),
          ])
        )
      )
      animsRef.current.forEach((a) => a.start())
    } else {
      animsRef.current.forEach((a) => a.stop())
      ;[bar1, bar2, bar3].forEach((b) => b.setValue(0.4))
    }
    return () => { animsRef.current.forEach((a) => a.stop()) }
  }, [playing])

  const handlePress = async () => {
    if (playing) {
      await soundRef.current?.stopAsync().catch(() => {})
      await soundRef.current?.unloadAsync().catch(() => {})
      soundRef.current = null
      setPlaying(false)
      return
    }

    setPlaying(true)
    try {
      if (Platform.OS === 'ios') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          staysActiveInBackground: false,
        })
      }

      // Checks local cache first — instant if already downloaded
      const uri = await getAudioUri(text, voiceGender)
      const { sound } = await Audio.Sound.createAsync({ uri })
      soundRef.current = sound

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlaying(false)
          sound.unloadAsync().catch(() => {})
          soundRef.current = null
        }
      })

      await sound.playAsync()
    } catch {
      setPlaying(false)
    }
  }

  const barHeight = Math.round(size * 0.85)
  const barWidth = Math.max(2, Math.round(size * 0.17))

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={[styles.btn, style]}>
      {playing ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, height: barHeight }}>
          {[bar1, bar2, bar3].map((bar, i) => (
            <Animated.View
              key={i}
              style={{
                width: barWidth,
                height: barHeight,
                borderRadius: 2,
                backgroundColor: color,
                transform: [{ scaleY: bar }],
              }}
            />
          ))}
        </View>
      ) : (
        <Ionicons name="volume-medium-outline" size={size} color={idleColor} />
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
})
