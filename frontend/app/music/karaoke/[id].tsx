import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { Song } from '../../../lib/songs'
import { useMusicStore } from '../../../stores/musicStore'
import MicButton from '../../../components/lesson/MicButton'
import BottomNavBar from '../../../components/BottomNavBar'
import { similarity } from '../../../lib/fuzzy'
import { SpeechState } from '../../../lib/speech'
import { Colors } from '../../../constants/colors'

export default function KaraokeScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { currentSong, currentLineIndex, recordLineResult, nextLine, startKaraoke } = useMusicStore()

  const { data: fetchedSong, isLoading } = useQuery({
    queryKey: ['song', id],
    queryFn: async () => {
      const res = await api.get(`/api/music/songs/${id}`)
      return res.data.song as Song
    },
    enabled: !!id && currentSong?.id !== id,
  })

  const song = currentSong?.id === id ? currentSong : fetchedSong ?? null

  const [speechState, setSpeechState] = useState<SpeechState>('idle')
  const [interimText, setInterimText] = useState('')
  const [lastSpoken, setLastSpoken] = useState('')
  const [scoring, setScoring] = useState(false)

  useEffect(() => {
    if (song && currentSong?.id !== song.id) {
      startKaraoke(song)
    }
  }, [song?.id])

  if (isLoading || !song) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={Colors.navy} style={{ marginTop: 80 }} />
      </SafeAreaView>
    )
  }

  const safeIndex = Math.min(currentLineIndex, song.lyrics.length - 1)
  const currentLine = song.lyrics[safeIndex] ?? ''
  const nextLineText = safeIndex < song.lyrics.length - 1
    ? song.lyrics[safeIndex + 1]
    : null

  const handleListenFirst = async () => {
    try {
      const supported = await Linking.canOpenURL(song.youtubeUrl)
      if (supported) {
        await Linking.openURL(song.youtubeUrl)
      }
    } catch (error) {
      console.error('Failed to open YouTube URL:', error)
    }
  }

  const handleSTTResult = async (spoken: string) => {
    if (!spoken.trim()) {
      // Fallback if empty speech
      handleScoringResult(0, '')
      return
    }

    setLastSpoken(spoken)
    setScoring(true)
    setSpeechState('processing')

    try {
      const response = await api.post('/api/ai/pronunciation', {
        targetText: currentLine,
        spokenText: spoken,
      })

      const score = typeof response.data?.score === 'number'
        ? response.data.score
        : Math.round(similarity(spoken, currentLine) * 100)

      handleScoringResult(score, spoken)
    } catch (error) {
      console.warn('Scoring API error, falling back to local fuzzy match:', error)
      const localScore = Math.round(similarity(spoken, currentLine) * 100)
      handleScoringResult(localScore, spoken)
    }
  }

  const handleScoringResult = (score: number, spoken: string) => {
    setScoring(false)
    setSpeechState(score >= 60 ? 'success' : 'failed')

    recordLineResult({
      line: currentLine,
      score,
      spoken: spoken || '(no speech detected)',
    })

    // Auto-advance after a short delay (800ms)
    setTimeout(() => {
      setInterimText('')
      setLastSpoken('')
      setSpeechState('idle')

      const isLastLine = safeIndex >= song.lyrics.length - 1
      if (isLastLine) {
        router.replace({ pathname: '/music/results/[id]', params: { id: song.id } })
      } else {
        nextLine()
      }
    }, 800)
  }

  const progress = ((safeIndex + 1) / song.lyrics.length) * 100

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={Colors.navy} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>🎵 Music</Text>
          <Text style={styles.headerSubtitle}>Sing line by line</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Song Mini Card */}
      <View style={styles.miniCard}>
        <View style={styles.miniCardRow}>
          <Text style={styles.miniEmoji}>{song.emoji}</Text>
          <View style={styles.miniText}>
            <Text style={styles.miniTitle} numberOfLines={1}>{song.title}</Text>
            <Text style={styles.miniGenre}>{song.genre}</Text>
          </View>
          <TouchableOpacity
            style={styles.listenBadge}
            onPress={handleListenFirst}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-youtube" size={14} color="#FF0000" />
            <Text style={styles.listenBadgeText}>Listen First</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Line {safeIndex + 1} of {song.lyrics.length}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Lyric Cards */}
      <View style={styles.lyricsArea}>
        {/* Current Lyric Card */}
        <View style={styles.currentLyricCard}>
          <Text style={styles.singThisLabel}>SING THIS LINE:</Text>
          <Text style={styles.currentLyricText}>{currentLine}</Text>
        </View>

        {/* Next Lyric Card */}
        <View style={styles.nextLyricCard}>
          <Text style={styles.upNextLabel}>UP NEXT:</Text>
          <Text style={styles.nextLyricText} numberOfLines={1}>
            {nextLineText || 'End of song'}
          </Text>
        </View>
      </View>

      {/* Recording Area */}
      <View style={styles.recordArea}>
        {scoring ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.teal} />
            <Text style={styles.scoringText}>Scoring your singing...</Text>
          </View>
        ) : (
          <>
            {!!interimText && (
              <Text style={styles.interimText} numberOfLines={2}>
                Hearing: {interimText}
              </Text>
            )}
            {!!lastSpoken && !interimText && (
              <Text style={styles.lastSpokenText} numberOfLines={2}>
                You sang: "{lastSpoken}"
              </Text>
            )}

            <View style={styles.micWrapper}>
              <MicButton
                onResult={handleSTTResult}
                onInterim={setInterimText}
                onStateChange={setSpeechState}
                disabled={speechState === 'processing' || speechState === 'success'}
                tone="yellow"
                label="Tap mic to start singing"
              />
            </View>
          </>
        )}
      </View>
      <BottomNavBar />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F3F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.navy,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  miniCard: {
    backgroundColor: Colors.midBlue,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
  },
  miniCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  miniText: {
    flex: 1,
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  miniGenre: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  listenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  listenBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textDark,
  },
  progressContainer: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMid,
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.gold,
    borderRadius: 3,
  },
  lyricsArea: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 16,
  },
  currentLyricCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  singThisLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textLight,
    letterSpacing: 1,
    marginBottom: 10,
  },
  currentLyricText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy,
    lineHeight: 30,
  },
  nextLyricCard: {
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    opacity: 0.8,
  },
  upNextLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMid,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  nextLyricText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
  },
  recordArea: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  micWrapper: {
    marginTop: 12,
    marginBottom: 8,
  },
  interimText: {
    fontSize: 14,
    color: Colors.textMid,
    textAlign: 'center',
    height: 40,
    paddingHorizontal: 20,
  },
  lastSpokenText: {
    fontSize: 14,
    color: Colors.teal,
    fontWeight: '600',
    textAlign: 'center',
    height: 40,
    paddingHorizontal: 20,
  },
  scoringText: {
    fontSize: 14,
    color: Colors.textMid,
    fontWeight: '600',
    marginTop: 8,
  },
  loaderContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 40,
  },
})
