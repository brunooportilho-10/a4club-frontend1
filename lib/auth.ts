import { create } from 'zustand'
import Cookies from 'js-cookie'
import { auth } from './api'

export interface User {
  id: string
  email: string
  plano?: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  register: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hydrate: () => void
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  register: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await auth.register(email, password)
      const { token, user } = response.data
      Cookies.set('auth_token', token)
      Cookies.set('user', JSON.stringify(user))
      set({ user, token, isLoading: false })
    } catch (error: any) {
      const message = error.response?.data?.erro || 'Erro ao registrar'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await auth.login(email, password)
      const { token, user } = response.data
      Cookies.set('auth_token', token)
      Cookies.set('user', JSON.stringify(user))
      set({ user, token, isLoading: false })
    } catch (error: any) {
      const message = error.response?.data?.erro || 'Erro ao fazer login'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  logout: () => {
    Cookies.remove('auth_token')
    Cookies.remove('user')
    auth.logout()
    set({ user: null, token: null })
  },

  hydrate: () => {
    if (typeof window !== 'undefined') {
      const token = Cookies.get('auth_token')
      const userStr = Cookies.get('user')
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          set({ token, user })
        } catch (e) {
          Cookies.remove('auth_token')
          Cookies.remove('user')
        }
      }
    }
  },
}))
