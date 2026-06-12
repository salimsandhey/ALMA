import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NAVY, GREY } from '../../constants/colors'

export default function AdminLayout() {
  const insets = useSafeAreaInsets()

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
          paddingBottom: insets.bottom,
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          title: 'Feedback',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbox-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          title: 'Content',
          tabBarIcon: ({ color, size }) => <Ionicons name="layers-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />

      {/* Hidden screens — navigated from More or Content */}
      <Tabs.Screen name="modules"    options={{ href: null }} />
      <Tabs.Screen name="challenges" options={{ href: null }} />
      <Tabs.Screen name="songs"      options={{ href: null }} />
      <Tabs.Screen name="ai-usage"   options={{ href: null }} />
      <Tabs.Screen name="legal"      options={{ href: null }} />
    </Tabs>
  )
}
