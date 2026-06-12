import React, { useState, useEffect, useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, Modal, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { countryFlag } from '../lib/countries'
import { NAVY, GOLD, BG, GREY } from '../constants/colors'

const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
]

type Country = { id: string; name: string; code: string }
type Language = { id: string; code: string; label: string; flag: string; isSuggested: boolean }

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

type ProfileData = {
  displayName: string
  email: string
  avatarUrl: string | null
  age: number | null
  gender: string | null
  nativeLanguage: string | null
  country: string | null
}

export default function EditProfile() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setUser } = useAuthStore()

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: () => api.get('/api/users/me').then((r) => r.data),
  })

  const { data: countriesData } = useQuery<{ countries: Country[] }>({
    queryKey: ['countries'],
    queryFn: () => api.get('/api/countries').then((r) => r.data),
  })

  const { data: languagesData } = useQuery<{ languages: Language[] }>({
    queryKey: ['languages'],
    queryFn: () => api.get('/api/languages').then((r) => r.data),
  })

  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [country, setCountry] = useState('')         // ISO code e.g. "IN"
  const [nativeLanguage, setNativeLanguage] = useState('') // language code e.g. "fr"
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '')
      setAge(profile.age ? String(profile.age) : '')
      setGender(profile.gender ?? '')
      setCountry(profile.country ?? '')
      setNativeLanguage(profile.nativeLanguage ?? '')
    }
  }, [profile])

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.patch('/api/users/me', data).then((r) => r.data),
    onSuccess: (data) => {
      setUser(data.user)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      router.back()
    },
    onError: () => Alert.alert('Error', 'Could not save changes. Please try again.'),
  })

  const handlePickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled || !result.assets?.[0]) return

    const asset = result.assets[0]
    setAvatarUri(asset.uri)
    setUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('avatar', {
        uri: asset.uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as any)

      const { data } = await api.post('/api/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      queryClient.invalidateQueries({ queryKey: ['profile'] })
      const currentUser = useAuthStore.getState().user
      if (currentUser) setUser({ ...currentUser, avatarUrl: data.avatarUrl })
    } catch {
      Alert.alert('Upload failed', 'Could not upload photo. Please try again.')
      setAvatarUri(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = () => {
    if (!displayName.trim() || displayName.trim().length < 2) {
      Alert.alert('Validation', 'Full name must be at least 2 characters.')
      return
    }
    const ageNum = age ? parseInt(age, 10) : undefined
    if (age && (isNaN(ageNum!) || ageNum! < 10 || ageNum! > 100)) {
      Alert.alert('Validation', 'Please enter a valid age (10–100).')
      return
    }
    saveMutation.mutate({
      displayName: displayName.trim(),
      age: ageNum,
      gender: gender || undefined,
      country: country.trim() || undefined,
      nativeLanguage: nativeLanguage || undefined,
    })
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      ]
    )
  }

  const confirmDelete = async () => {
    try {
      await api.delete('/api/users/me')
      const { deleteToken } = await import('../lib/storage')
      await deleteToken()
      useAuthStore.getState().clearAuth()
      router.replace('/(auth)/login')
    } catch {
      Alert.alert('Error', 'Could not delete account. Please try again.')
    }
  }

  const initials = getInitials(displayName || profile?.displayName || '?')

  const allCountries = countriesData?.countries ?? []
  const allLanguages = languagesData?.languages ?? []

  const filteredCountries = useMemo(() => {
    const q = pickerSearch.toLowerCase()
    if (!q) return allCountries
    return allCountries.filter((c) => c.name.toLowerCase().includes(q))
  }, [pickerSearch, allCountries])

  const filteredLanguages = useMemo(() => {
    const q = pickerSearch.toLowerCase()
    if (!q) return allLanguages
    return allLanguages.filter((l) => l.label.toLowerCase().includes(q) || l.code.toLowerCase().includes(q))
  }, [pickerSearch, allLanguages])

  const selectedCountryName = allCountries.find((c) => c.code === country)?.name ?? country
  const selectedLangLabel = allLanguages.find((l) => l.code === nativeLanguage)?.label ?? nativeLanguage
  const selectedLangFlag = allLanguages.find((l) => l.code === nativeLanguage)?.flag ?? ''

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={NAVY} style={{ marginTop: 80 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickAvatar} activeOpacity={0.8} disabled={uploadingAvatar}>
            {avatarUri || profile?.avatarUrl ? (
              <Image source={{ uri: avatarUri ?? profile?.avatarUrl! }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarInitials}>
                <Text style={styles.avatarInitialsText}>{initials.toLowerCase()}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Ionicons name="camera" size={14} color="#FFFFFF" />
              }
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Full Name */}
        <Text style={styles.label}>FULL NAME</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
        />

        {/* Email (read-only) */}
        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <View style={[styles.input, styles.inputReadOnly]}>
          <Text style={styles.inputReadOnlyText}>{profile?.email}</Text>
        </View>

        {/* Age */}
        <Text style={styles.label}>AGE</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder="Your age"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={3}
        />

        {/* Gender */}
        <Text style={styles.label}>GENDER</Text>
        <View style={styles.pillRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.pill, gender === g.value && styles.pillActive]}
              onPress={() => setGender(g.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, gender === g.value && styles.pillTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Country */}
        <Text style={styles.label}>COUNTRY</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => { setPickerSearch(''); setShowCountryPicker(true) }} activeOpacity={0.8}>
          <Text style={[styles.pickerBtnText, !country && styles.pickerBtnPlaceholder]}>
            {country ? `${countryFlag(country)}  ${selectedCountryName}` : 'Select your country'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={GREY} />
        </TouchableOpacity>

        {/* Native Language */}
        <Text style={styles.label}>NATIVE LANGUAGE</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => { setPickerSearch(''); setShowLangPicker(true) }} activeOpacity={0.8}>
          <Text style={[styles.pickerBtnText, !nativeLanguage && styles.pickerBtnPlaceholder]}>
            {nativeLanguage ? `${selectedLangFlag}  ${selectedLangLabel}` : 'Select your language'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={GREY} />
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, saveMutation.isPending && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saveMutation.isPending}
          activeOpacity={0.85}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color={NAVY} />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={15} color="#EF4444" />
          <Text style={styles.deleteBtnText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} animationType="slide">
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
              <Ionicons name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.modalSearch}
            value={pickerSearch}
            onChangeText={setPickerSearch}
            placeholder="Search country..."
            placeholderTextColor="#9CA3AF"
            autoFocus
            autoCorrect={false}
          />
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerItem, country === item.code && styles.pickerItemActive]}
                onPress={() => { setCountry(item.code); setShowCountryPicker(false) }}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerItemFlag}>{countryFlag(item.code)}</Text>
                <Text style={[styles.pickerItemLabel, country === item.code && styles.pickerItemLabelActive]}>
                  {item.name}
                </Text>
                {country === item.code && <Ionicons name="checkmark" size={16} color={NAVY} />}
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </SafeAreaView>
      </Modal>

      {/* Language Picker Modal */}
      <Modal visible={showLangPicker} animationType="slide">
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <TouchableOpacity onPress={() => setShowLangPicker(false)}>
              <Ionicons name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.modalSearch}
            value={pickerSearch}
            onChangeText={setPickerSearch}
            placeholder="Search language..."
            placeholderTextColor="#9CA3AF"
            autoFocus
            autoCorrect={false}
          />
          <FlatList
            data={filteredLanguages}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerItem, nativeLanguage === item.code && styles.pickerItemActive]}
                onPress={() => { setNativeLanguage(item.code); setShowLangPicker(false) }}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerItemFlag}>{item.flag}</Text>
                <Text style={[styles.pickerItemLabel, nativeLanguage === item.code && styles.pickerItemLabelActive]}>
                  {item.label}
                </Text>
                {nativeLanguage === item.code && <Ionicons name="checkmark" size={16} color={NAVY} />}
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: BG,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrap: { width: 88, height: 88, borderRadius: 44, position: 'relative' },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  avatarInitials: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitialsText: { color: '#FFFFFF', fontSize: 32, fontWeight: '300' },
  avatarHint: { fontSize: 12, color: GREY, marginTop: 6 },
  cameraBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: BG,
  },
  // Form
  label: {
    fontSize: 11, fontWeight: '700', color: GREY,
    letterSpacing: 0.5, marginBottom: 6, marginTop: 14,
  },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 15, color: '#111827',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  inputReadOnly: { justifyContent: 'center' },
  inputReadOnlyText: { fontSize: 15, color: '#9CA3AF' },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 9, backgroundColor: '#FFFFFF',
  },
  pillActive: { borderColor: NAVY, backgroundColor: '#FFFFFF' },
  pillText: { fontSize: 14, color: GREY, fontWeight: '500' },
  pillTextActive: { color: NAVY, fontWeight: '700' },
  pickerBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, borderWidth: 1, borderColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  pickerBtnText: { fontSize: 15, color: '#111827', flex: 1 },
  pickerBtnPlaceholder: { color: '#9CA3AF' },
  modalSafe: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalSearch: {
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: '#111827',
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  pickerItemActive: { backgroundColor: '#EEF2FF' },
  pickerItemFlag: { fontSize: 22, width: 32 },
  pickerItemLabel: { flex: 1, fontSize: 15, color: '#111827' },
  pickerItemLabelActive: { color: NAVY, fontWeight: '600' },
  saveBtn: {
    backgroundColor: GOLD, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginTop: 28,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 16, paddingVertical: 10,
  },
  deleteBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
})
