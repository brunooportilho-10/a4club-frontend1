import { create } from 'zustand'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth } from './firebase'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string
  hydrate: () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const mensagens: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos',
  'auth/wrong-password': 'E-mail ou senha incorretos',
  'auth/user-not-found': 'Usuário não encontrado',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos',
  'auth/unauthorized-domain': 'Domínio não autorizado no Firebase',
  'auth/network-request-failed': 'Falha de conexão. Verifique sua internet',
}

let hydrated = false

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: '',

  hydrate: () => {
    if (hydrated) return
    hydrated = true
    onAuthStateChanged(auth, (user) => {
      set({ user })
    })
  },

  login: async (email, password) => {
    set({ isLoading: true, error: '' })
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      set({ user: cred.user, isLoading: false })
    } catch (err: any) {
      const msg = mensagens[err.code] || 'Erro ao fazer login'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
  },

  logout: async () => {
    await signOut(auth)
    set({ user: null })
  },
}))
