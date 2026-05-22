import axios from 'axios'
import { getToken, deleteToken } from './storage'
import { useAuthStore } from '../stores/authStore'

function normalizeApiBaseUrl(rawUrl?: string) {
  if (!rawUrl) return ''
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `http://${trimmed}`
}

export const API_BASE_URL = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_URL)

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

api.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await deleteToken()
      useAuthStore.getState().clearAuth()
    }
    return Promise.reject(error)
  }
)
