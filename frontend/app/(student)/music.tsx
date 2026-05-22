import React from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Song } from '../../lib/songs'
import { Colors } from '../../constants/colors'

const EMOJI_BG_COLORS = [
  '#DBEAFE',
  '#FCE7F3',
  '#DCFCE7',
  '#FEF9C3',
  '#F3E8FF',
  '#FFE4E6',
]

function SongCard({ song, index }: { song: Song; index: number }) {
  const router = useRouter()
  const bgColor = EMOJI_BG_COLORS[index % EMOJI_BG_COLORS.length]

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => router.push({ pathname: '/music/[id]', params: { id: song.id } })}
    >
      <View style={styles.cardRow}>
        <View style={[styles.emojiBox, { backgroundColor: bgColor }]}>
          <Text style={styles.emojiText}>{song.emoji}</Text>
        </View>
        <View style={styles.textCol}>
          <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
          <Text style={styles.artistName} numberOfLines={1}>{song.artist}</Text>
        </View>
        <View style={styles.rightCol}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Karaoke</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function MusicScreen() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['songs'],
    queryFn: async () => {
      const res = await api.get('/api/music/songs')
      return res.data.songs as Song[]
    },
  })

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text style={styles.heading}>🎵 Music</Text>
            <Text style={styles.subtitle}>Sing along to popular songs to improve your English!</Text>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={Colors.navy} style={{ marginTop: 40 }} />
          ) : isError ? (
            <Text style={styles.errorText}>Failed to load songs. Please try again.</Text>
          ) : null
        }
        renderItem={({ item, index }) => <SongCard song={item} index={index} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F3F7' },
  listContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 },
  heading: { fontSize: 28, fontWeight: '800', color: Colors.navy },
  subtitle: { fontSize: 14, color: Colors.textMid, marginTop: 4, marginBottom: 24 },
  errorText: { textAlign: 'center', marginTop: 40, color: Colors.textMid, fontSize: 14 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  emojiBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 24 },
  textCol: { flex: 1, marginLeft: 12, marginRight: 8 },
  songTitle: { fontSize: 16, fontWeight: '700', color: Colors.navy, marginTop: 2 },
  artistName: { fontSize: 13, color: Colors.textMid, marginTop: 2 },
  rightCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    backgroundColor: '#FEF9C3',
    borderColor: '#F5A623',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, color: '#D97706', fontWeight: '700' },
  chevron: { fontSize: 22, color: '#9CA3AF', fontWeight: '300' },
})
