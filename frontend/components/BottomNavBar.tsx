import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NAVY, LIGHT_GREY } from '../constants/colors'
import {
  NAV_TABS, NAV_BAR_HEIGHT_BASE, NAV_BAR_BORDER_COLOR, NAV_ICON_SIZE, NAV_LABEL_STYLE,
  NAV_BAR_MIN_TOTAL_HEIGHT,
} from '../constants/tabs'

export default function BottomNavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const bottomPad = Math.max(NAV_BAR_MIN_TOTAL_HEIGHT - NAV_BAR_HEIGHT_BASE, insets.bottom)
  return (
    <View style={[styles.container, { height: NAV_BAR_HEIGHT_BASE + bottomPad, paddingBottom: bottomPad }]}>
      {NAV_TABS.map(tab => {
        const active = pathname.includes(tab.route.split('/').pop()!)
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => router.replace(tab.route as any)}
            activeOpacity={0.7}
          >
            <Ionicons name={tab.icon as any} size={NAV_ICON_SIZE} color={active ? NAVY : LIGHT_GREY} />
            <Text style={[styles.label, { color: active ? NAVY : LIGHT_GREY }]} numberOfLines={1} ellipsizeMode="tail">{tab.label}</Text>
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
    borderTopColor: NAV_BAR_BORDER_COLOR,
    paddingTop: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 2,
  },
  label: {
    ...NAV_LABEL_STYLE,
    maxWidth: '85%',
    textAlign: 'center',
  },
})
