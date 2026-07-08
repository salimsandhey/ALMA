import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { useAudioDownloadStore } from '../lib/audioCache'

export default function AudioDownloadBanner() {
  const { status, downloaded, total } = useAudioDownloadStore()
  const opacity = useRef(new Animated.Value(0)).current
  const visible = status === 'downloading' || status === 'done'

  useEffect(() => {
    if (status === 'downloading') {
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start()
    } else if (status === 'done') {
      // Stay visible briefly then fade out, then reset — otherwise `status`
      // stays 'done' forever in the global store, and remounting this
      // component later (e.g. navigating back to this screen) would replay
      // the whole appear/disappear animation again for no reason.
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        useAudioDownloadStore.getState().reset()
      })
    }
  }, [status])

  if (!visible) return null

  const percent = total > 0 ? Math.round((downloaded / total) * 100) : 0
  const isDone = status === 'done'

  return (
    <Animated.View style={[styles.banner, { opacity }]}>
      <View style={styles.row}>
        <Text style={styles.icon}>{isDone ? '✓' : '⬇'}</Text>
        <View style={styles.textCol}>
          <Text style={styles.label}>
            {isDone ? 'Offline content ready' : `Downloading offline content…`}
          </Text>
          {!isDone && (
            <Text style={styles.sub}>{downloaded} / {total} files</Text>
          )}
        </View>
        {!isDone && (
          <Text style={styles.percent}>{percent}%</Text>
        )}
      </View>

      {!isDone && (
        <View style={styles.trackBg}>
          <Animated.View style={[styles.trackFill, { width: `${percent}%` as any }]} />
        </View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: '#0B1F4B',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 999,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 16,
    color: '#F5C518',
  },
  textCol: {
    flex: 1,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  sub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 1,
  },
  percent: {
    color: '#F5C518',
    fontSize: 13,
    fontWeight: '700',
  },
  trackBg: {
    marginTop: 8,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: 3,
    backgroundColor: '#F5C518',
    borderRadius: 2,
  },
})
