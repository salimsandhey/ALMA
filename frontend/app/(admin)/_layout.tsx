import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NAVY, GREY } from '../../constants/colors'

export default function AdminLayout() {
  const insets = useSafeAreaInsets()
  const bottomPad = insets.bottom

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: NAVY,
        tabBarInactiveTintColor: GREY,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 40 + bottomPad,
          paddingBottom: bottomPad,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          padding: 0,
        },
        tabBarIconStyle: { marginBottom: 0 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 0 },
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          title: 'Feedback',
          tabBarIcon: ({ color }) => <Ionicons name="chatbox-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          title: 'Content',
          tabBarIcon: ({ color }) => <Ionicons name="layers-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={22} color={color} />,
        }}
      />

      {/* Hidden screens — navigated from More or Content */}
      <Tabs.Screen name="modules"    options={{ href: null }} />
      <Tabs.Screen name="challenges" options={{ href: null }} />
      <Tabs.Screen name="songs"      options={{ href: null }} />
      <Tabs.Screen name="ai-usage"   options={{ href: null }} />
      <Tabs.Screen name="legal"      options={{ href: null }} />
      <Tabs.Screen name="app-links" options={{ href: null }} />
    </Tabs>
  )
}
