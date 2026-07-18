import { create } from 'zustand'
import Cookies from 'js-cookie'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth as firebaseAuth } from './firebase'

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

const mensagens: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos',
  'auth/wrong-password': 'E-mail ou senha incorretos',
  'auth/user-not-found': 'Usuário não encontrado',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado',
  'auth/weak-password': 'A senha deve ter no mínimo 6 caracteres',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos',
  'auth/unauthorized-domain': 'Domínio não autorizado no Firebase',
  'auth/network-request-failed': 'Falha de conexão. Verifique sua internet',
}

function traduzErro(code: string): string {
  return mensagens[code] || 'Erro ao fazer login'
}

function mapUser(fbUser: { uid: string; email: string | null }): User {
  return { id: fbUser.uid, email: fbUser.email || '' }
}

let hydrated = false

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  register: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password)
      const token = await cred.user.getIdToken()
      const user = mapUser(cred.user)
      Cookies.set('auth_token', token)
      Cookies.set('user', JSON.stringify(user))
      set({ user, token, isLoading: false })
    } catch (error: any) {
      const message = traduzErro(error.code)
      set({ error: message, isLoading: false })
      throw new Error(message)
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const
