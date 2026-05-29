import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { deleteToken } from '../../lib/storage'
import { useAuthStore } from '../../stores/authStore'
import { api } from '../../lib/api'

const NAVY = '#093373'

export default function Profile() {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleLogout = async () => {
    await deleteToken()
    useAuthStore.getState().clearAuth()
    router.replace('/(auth)/login')
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    )
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete('/api/users/me')
      await deleteToken()
      useAuthStore.getState().clearAuth()
      router.replace('/(auth)/login')
    } catch {
      Alert.alert('Error', 'Could not delete account. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAccount}
        activeOpacity={0.85}
        disabled={deleting}
      >
        {deleting ? (
          <ActivityIndicator color="#EF4444" />
        ) : (
          <Text style={styles.deleteText}>Delete Account</Text>
        )}
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
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: NAVY,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
})
