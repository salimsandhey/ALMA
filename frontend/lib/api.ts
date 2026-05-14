import axios from 'axios'
import { getToken, deleteToken } from './storage'
import { useAuthStore } from '../stores/authStore'

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
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
