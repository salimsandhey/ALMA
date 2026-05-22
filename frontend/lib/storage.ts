import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'alma_jwt'

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function saveFlag(key: string): Promise<void> {
  await SecureStore.setItemAsync(key, 'true')
}

export async function getFlag(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key)
}
