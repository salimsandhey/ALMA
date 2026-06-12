import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NAVY, LIGHT_GREY } from '../constants/colors'

const TABS = [
  { label: 'Home', icon: 'home-outline', route: '/(student)/home' },
  { label: 'Modules', icon: 'book-outline', route: '/(student)/modules' },
  { label: 'Entertainment', icon: 'compass-outline', route: '/(student)/explore' },
  { label: 'Music', icon: 'musical-notes-outline', route: '/(student)/music' },
  { label: 'Profile', icon: 'person-outline', route: '/(student)/profile' },
] as const

export default function BottomNavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.container, { height: 60 + insets.bottom, paddingBottom: 8 + insets.bottom }]}>
      {TABS.map(tab => {
        const active =
          pathname.includes(tab.label.toLowerCase()) ||
          (tab.label === 'Entertainment' && pathname.includes('explore'))
        return (
          <TouchableOpacity
            key={tab.label}
            style={styles.tab}
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.7}
          >
            <Ionicons name={tab.icon as any} size={20} color={active ? NAVY : LIGHT_GREY} />
            <Text style={[styles.label, { color: active ? NAVY : LIGHT_GREY }]} numberOfLines={1}>{tab.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
})
