import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Song } from '../../lib/songs'
import { useMusicStore } from '../../stores/musicStore'
import { Colors } from '../../constants/colors'
import BottomNavBar from '../../components/BottomNavBar'

export default function SongDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const startKaraoke = useMusicStore((s) => s.startKaraoke)

  const { data: song, isLoading, isError } = useQuery({
    queryKey: ['song', id],
    queryFn: async () => {
      const res = await api.get(`/api/music/songs/${id}`)
      return res.data.song as Song
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={Colors.navy} style={{ marginTop: 80 }} />
      </SafeAreaView>
    )
  }

  if (isError || !song) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.navy} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Not Found</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Song not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const handleListenFirst = async () => {
    try {
      const supported = await Linking.canOpenURL(song.youtubeUrl)
      if (supported) {
        await Linking.openURL(song.youtubeUrl)
      }
    } catch (error) {
      console.error('Failed to open URL:', error)
    }
  }

  const handleStartKaraoke = () => {
    startKaraoke(song)
    router.push({ pathname: '/music/karaoke/[id]', params: { id: song.id } })
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={Colors.navy} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🎵 Music</Text>
          <Text style={styles.headerSub}>Sing along to improve your English!</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Song Info Card */}
        <View style={styles.songCard}>
          <Text style={styles.largeEmoji}>{song.emoji}</Text>
          <Text style={styles.songTitle}>{song.title}</Text>
          <Text style={styles.artistName}>{song.artist}</Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.listenBtn}
              onPress={handleListenFirst}
              activeOpacity={0.8}
            >
              <Ionicons name="open-outline" size={16} color="#FFFFFF" />
              <Text style={styles.listenBtnText}>Listen First</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.karaokeBtn}
              onPress={handleStartKaraoke}
              activeOpacity={0.8}
            >
              <Ionicons name="mic-outline" size={16} color={Colors.navy} />
              <Text style={styles.karaokeBtnText}>Start Karaoke</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lyrics Preview */}
        <View style={styles.lyricsContainer}>
          <Text style={styles.lyricsHeader}>LYRICS PREVIEW</Text>
          <View style={styles.lyricsBox}>
            {song.lyrics.map((line, idx) => (
              <Text key={idx} style={styles.lyricLine}>
                {line}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.navy,
  },
  headerSub: {
    fontSize: 12,
    color: '#98A2B3',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  songCard: {
    backgroundColor: Colors.navy,
    borderRadius: 20,
    padding: 20,
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginBottom: 18,
  },
  largeEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },
  songTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  artistName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 4,
    textAlign: 'left',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    width: '100%',
  },
  listenBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    height: 40,
  },
  listenBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  karaokeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    borderRadius: 14,
    height: 40,
    elevation: 1,
  },
  karaokeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  lyricsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  lyricsHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#A3AAB8',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  lyricsBox: {
    gap: 10,
  },
  lyricLine: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#98A2B3',
  },
})
