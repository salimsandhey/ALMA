import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { deleteToken } from '../../lib/storage'
import { useAuthStore } from '../../stores/authStore'

export default function Profile() {
  const router = useRouter()

  const handleLogout = async () => {
    await deleteToken()
    useAuthStore.getState().clearAuth()
    router.replace('/(auth)/login')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0B1F4B',
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: '#0B1F4B',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
})
