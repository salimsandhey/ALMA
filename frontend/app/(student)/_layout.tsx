import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { NAVY, LIGHT_GREY } from '../../constants/colors'

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: NAVY,
        tabBarInactiveTintColor: LIGHT_GREY,
        tabBarStyle: {
          borderTopColor: '#E5E7EB',
          backgroundColor: '#fff',
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="modules"
        options={{
          title: 'Modules',
          tabBarIcon: ({ color }) => <Ionicons name="book-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Entertainment',
          tabBarIcon: ({ color }) => <Ionicons name="film-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="music"
        options={{
          title: 'Music',
          tabBarIcon: ({ color }) => <Ionicons name="musical-notes-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{ href: null }}
      />
    </Tabs>
  )
}
