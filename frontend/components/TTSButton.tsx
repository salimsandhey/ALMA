import React, { useState, useRef, useEffect } from 'react'
import { TouchableOpacity, View, Animated, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Speech from 'expo-speech'

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
  const [playing, setPlaying] = useState(false)
  const bar1 = useRef(new Animated.Value(0.4)).current
  const bar2 = useRef(new Animated.Value(0.4)).current
  const bar3 = useRef(new Animated.Value(0.4)).current
  const animsRef = useRef<Animated.CompositeAnimation[]>([])

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

  const handlePress = () => {
    if (playing) {
      Speech.stop()
      setPlaying(false)
      return
    }
    Speech.stop()
    setPlaying(true)
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => setPlaying(false),
      onError: () => setPlaying(false),
    })
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
